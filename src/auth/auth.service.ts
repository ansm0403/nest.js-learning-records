import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDTO } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET_KEY,
} from 'src/common/const/env-keys.const';

interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 토큰을 사용하게 되는 방식
   *
   * 1) 사용자가 로그인 또는 회원가입을 진행하면
   *    accessToken 과 refreshToken 을 발급받는다.
   *
   * 2) 로그인할 때에는 Basic Token 과 함께 요청을 보낸다.
   *    Basic 토큰은 '이메일:비밀번호' 를 Base64 로 인코딩한 형태이다.
   *    예) { authorization : 'Basic {token}' }
   *
   * 3) 아무나 접근할 수 없는 정보 { private route } 를 접근할 떄에는
   *    accessToken 을 Header 에 추가하여 요청과 함께 보낸다.
   *    예) { authorization : 'Bearer {token}' }
   *
   * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
   *
   * 5) 모든 토큰은 만료기간이 있다. 만료기간이 지나면 새로 토큰을 발급받아야한다.
   *    그렇지 않으면 jwtService.verify() 에서 인증이 통과되지 않음.
   *    그러니 access 토큰을 새로 발급받을 수 있는 /auth/token/access 와 refresh 토큰을 새로 발급받을 수 있는 /auth/token/refresh 가 필요하다.
   *
   * 6) 토큰이 만료되면 각각의 토큰을 새로 발급받을 수 있는 엔드포인트에 요청을 해서
   *    새로운 토큰을 발급받고 새로운 토큰을 사용해서 private route 에 접근한다. 즉 4번을 다시 한다.
   */

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    const token = splitToken[1];

    return token;
  }

  // email:password 를 base64 인코딩
  // rsdgwewgwrgr;grgrgrwewhwh;w3ree 형태를 다시 디코딩하여 email:password로 변경
  // 콜론을 기준으로 split
  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐거나 잘못된 토큰입니다.');
    }
  }

  rotateToken(token: string, isRefereshToken: boolean) {
    const decoded: JwtPayload = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
    });

    /**
     * sub: id
     * email
     * type: 'access' | 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 리프레시 토큰으로만 가능합니다.',
      );
    }

    return this.signToken(
      {
        id: +decoded.sub,
        email: decoded.email,
      },
      isRefereshToken,
    );
  }

  /**
   * loginUser() 에 필요한 accessToken 과 refreshToken 을 sign 하는 로직
   * payload에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type : 'access' | 'refresh'
   */
  signToken(user: Pick<UserModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  /**
   * registerWithEmail() 과 loginWithEmail() 에서 필요한 accessToken 과 refreshToken 을 반환하는 로직.
   */
  loginUser(user: Pick<UserModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  /**
   * loginWithEmail() 에서 로그인을 진행할 때 필요한 기본적인 검증 진행.
   *
   * 1. 사용자가 존재하는지 확인(email)
   * 2. 비밀번호가 맞는지 확인
   * 3. 모두 확인되면 찾은 사용자 정보 반환
   * 4. loginWithEmail 에서 반환된 데이터를 기반으로 토큰 생성
   */
  async authenticateWithEmailAndPassword(
    user: Pick<UserModel, 'email' | 'password'>,
  ) {
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    /**
     * 파라미터
     *
     * 1) 입력된 비밀번호
     * 2) 해시값 (사용자 정보에 저장되어있는 해시)
     */

    let isPasswordMatching: boolean;

    try {
      isPasswordMatching = await bcrypt.compare(
        user.password,
        existingUser.password,
      );
    } catch (error) {
      throw new UnauthorizedException('인증 처리 중 오류가 발생했습니다.');
    }

    if (!isPasswordMatching) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existingUser;
  }

  /**
   * email, password 를 검증하여 완료되면 access/refreshToken 반환
   */
  async loginWithEmail(user: Pick<UserModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  /**
   * email, nickname, password 를 입력받고 사용자를 생성
   * 생성이 완료되면 accessToken 과 refreshToken 을 반환
   * 회원가입 후 다시 로그인하는 쓸데없는 과정 없앰.
   */
  async registerWithEmail(user: RegisterUserDTO) {
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY) as string),
    );

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
