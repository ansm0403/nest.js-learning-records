import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDTO } from './dto/create-post.dto';
import { UpdatePostDTO } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { UserModel } from 'src/users/entity/users.entity';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource } from 'typeorm';
import { PostImageService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import type { QueryRunner as QR } from 'typeorm';
import { Roles } from 'src/users/decorator/roles.decorator';
import { Role } from 'src/users/const/roles.const';
import { IsPublic } from 'src/common/decorator/is-public.decorator';
import { IsPostMineOrAdmin } from './guard/is-post-mine-or-admin.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postImageService: PostImageService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postRandomPosts(@User() user: UserModel) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  @Get()
  @IsPublic()
  @UseInterceptors(LogInterceptor)
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  @Get(':id')
  @IsPublic()
  getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postPost(
    @User('id') userId: number,
    @Body() body: CreatePostDTO,
    // @Body('title') title: string,
    // @Body('content') content: string,
    @QueryRunner() qr: QR,
  ) {
    const post = await this.postsService.createPost(userId, body, qr);

    for (let i = 0; i < body.images.length; i++) {
      await this.postImageService.createPostImage(
        {
          post,
          order: i,
          path: body.images[i],
          type: ImageModelType.POST_IMAGE,
        },
        qr,
      );

      return this.postsService.getPostById(post.id, qr);
    }
  }

  @Patch(':postId')
  @UseGuards(IsPostMineOrAdmin)
  patchPost(
    @Param('postId', ParseIntPipe) id: number,
    @Body() body: UpdatePostDTO,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  @UseGuards(IsPostMineOrAdmin)
  @Roles(Role.ADMIN)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
