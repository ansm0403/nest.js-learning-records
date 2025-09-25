import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PaginateCommentDto } from './dto/paginate-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentModel } from './entity/comment.entity';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserModel } from 'src/users/entity/users.entity';
import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';
import { PatchCommentDto } from './dto/patch-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentModel)
    private readonly commentRepository: Repository<CommentModel>,
    private readonly commonService: CommonService,
  ) {}

  paginateComments(dto: PaginateCommentDto, postId: number) {
    return this.commonService.paginate(
      dto,
      this.commentRepository,
      {
        // where: {
        //   post: {
        //     id: postId,
        //   },
        // },
        ...DEFAULT_COMMENT_FIND_OPTIONS,
      },
      `posts/${postId}/comments`,
    );
  }
  async getCommentById(commentId: number) {
    const comment = await this.commentRepository.findOne({
      ...DEFAULT_COMMENT_FIND_OPTIONS,
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new BadRequestException(
        `id: ${commentId} 의 댓글이 존재하지 않습니다.`,
      );
    }

    return comment;
  }

  async createComment(
    dto: CreateCommentDto,
    postId: number,
    author: UserModel,
  ) {
    return this.commentRepository.save({
      ...dto,
      post: {
        id: postId,
      },
      author,
    });
  }

  async patchComment(dto: PatchCommentDto, commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new BadRequestException(
        `id: ${commentId} 댓글은 존재하지 않습니다.`,
      );
    }

    const prevComment = await this.commentRepository.preload({
      id: commentId,
      ...dto,
    });

    if (!prevComment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    const newComment = await this.commentRepository.save(prevComment);

    return newComment;
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepository.findOne({
      where: {
        id,
      },
    });

    if (!comment) {
      throw new BadRequestException(`id: ${id} 댓글은 존재하지 않습니다.`);
    }

    return this.commentRepository.delete(id);
  }
}
