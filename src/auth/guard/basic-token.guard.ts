import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: any; // 나중에 User 엔티티로 바꿀 수 있음
}

/**
 * 구현할 기능
 *
 * 1) 요청객체 request 를 불러오고
 *    authorization header 로부터 토큰을 가져온다.
 * 2) authService.extractTokeenFromHeader 를 이용해서
 *    사용할 수 있는 형태의 토큰을 추출한다.
 * 3) authService.decodeBasicToken 을 실행해서
 *    email 과 password 를 추출한다.
 * 4) email 과 password 를 이용해서 사용자를 가져온다.
 *    어디서? authService.authenticatieWithEmailAndPassword 를 통해
 * 5) 찾아낸 사용자를 (1) 번 요청 객체에 붙여준다.
 *    req.user = user; 로.
 *    그래서 어디에서든 Guard 에서 미리 붙여놓은 유저를 사용할 수 있다.
 *    매번 무언가를 하려할 때 데이터베이스에서 유저를 찾을 필요가 없어짐.
 */
@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  // 반환할 때 boolean 인 이유는 반환값이 false 라면 가드 통과 못하고 true 라면 가능.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const rawToken = req.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const { email, password } = this.authService.decodeBasicToken(token);

    const user = await this.authService.authenticateWithEmailAndPassword({
      email,
      password,
    });

    req.user = user;

    return true;
  }
}
