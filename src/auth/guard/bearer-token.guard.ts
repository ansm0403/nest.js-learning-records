import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { UserModel } from 'src/users/entities/users.entity';

type TokenType = 'access' | 'refresh';

interface RequestToken extends Request {
  user: UserModel;
  token?: string;
  tokenType?: TokenType;
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestToken>();

    const rawToken = req.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const result = await this.authService.verifyToken(token);

    const user = (await this.usersService.getUserByEmail(
      result.email,
    )) as UserModel;

    req.user = user;
    req.token = token;
    req.tokenType = result.type;

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<RequestToken>();

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('ACCESS TOKEN 이 아닙니다.');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<RequestToken>();

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('REFRESH TOKEN 이 아닙니다.');
    }

    return true;
  }
}
