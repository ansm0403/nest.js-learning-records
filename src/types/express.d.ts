import { UserModel } from 'src/users/entities/users.entity';
import { QueryRunner } from 'typeorm';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserModel;
    queryRunner?: QueryRunner;
  }
}
