import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';

export const QueryRunner = createParamDecorator(
  (data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.queryRunner) {
      throw new InternalServerErrorException(
        `QueryRunner Decorator 를 사용하려면 TranscationInterceptor 를 적용해야 합니다.`,
      );
    }
    return req.queryRunner;
  },
);
