import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostExistMiddleware implements NestMiddleware {
  constructor(private readonly postSerivce: PostsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const postId = req.params.postId;

    if (!postId) {
      throw new BadRequestException('postId 파라미터는 필수 입니다.');
    }

    const exist = await this.postSerivce.checkPostExistById(parseInt(postId));

    if (!exist) {
      throw new BadRequestException(`${postId} 포스트가 존재하지 않습니다.`);
    }

    next();
  }
}
