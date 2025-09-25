import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entity/posts.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDTO extends PickType(PostsModel, ['title', 'content']) {
  @IsString({
    each: true,
  })
  @IsOptional()
  images: string[];
}
