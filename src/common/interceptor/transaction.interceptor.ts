import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, finalize, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();

    // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리러너 생성
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너 연결
    await qr.connect();
    // 쿼리러너에서 트랜잭션 시작.
    // 이 시점부터 같은 쿼리 러너를 사용하면
    // 트랜잭션 안에서 데이터베이스 액션을 실행
    await qr.startTransaction();

    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async (e) => {
        await qr.rollbackTransaction();
        await qr.release();

        throw new InternalServerErrorException('TRANSACTION ERROR');
      }),
      finalize(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
