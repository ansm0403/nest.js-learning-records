import { UserModel } from 'src/users/entity/users.entity';
import { QueryRunner } from 'typeorm';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserModel;
    queryRunner?: QueryRunner;
    isRoutePublic?: boolean;
  }
}
