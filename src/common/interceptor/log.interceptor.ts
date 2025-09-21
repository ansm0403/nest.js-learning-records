import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    /**
     * 1. 요청이 들어올때 REQ 요청이 들어온 타임스탬프를 찍는다.
     * [REQ] { 요청 path } { 요청 시간 }
     *
     * 2. 응답이 나갈때 다시 타임스탬프를 찍는다.
     * [RES] { 요청 path } { 응답 시간 }
     */
    const req = context.switchToHttp().getRequest<Request>();

    // /posts 혹은 /common/image 등
    const path = req.originalUrl;

    const now = new Date();

    // [REQ] { 요청 path } { 요청 시간 }
    console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    // return next.handle() 을 실행하는 순간 라우트의 로직이 전부 실행되고 응답 반환. observable 로 반환.
    // 즉, 이 위까지가 요청 로직이고 이 아래부터 응답 로직
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `[RES] ${path} ${now.toLocaleString('kr')} ${new Date().getMilliseconds() - now.getMilliseconds()}ms`,
          ),
        ),
      );
  }
}
