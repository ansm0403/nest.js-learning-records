import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDTO } from './dto/create-post.dto';
import { UpdatePostDTO } from './dto/update-post.dto';
import { CommonService } from 'src/common/common.service';
import { BasePaginationDto } from 'src/common/dto/base-pagination.dto';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { ConfigService } from '@nestjs/config';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  async getAllPosts() {
    return await this.postsRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
    });
  }

  async paginatePosts(query: BasePaginationDto) {
    // if (query.page) {
    //   return this.pagePaginatePosts(query);
    // } else {
    //   return this.cursorPaginatePosts(query);
    // }
    return this.commonService.paginate(
      query,
      this.postsRepository,
      { ...DEFAULT_POST_FIND_OPTIONS },
      'posts',
    );
  }

  async cursorPaginatePosts(query: BasePaginationDto) {
    const where: FindOptionsWhere<PostsModel> = {};

    if (query.where__id__less_than) {
      where.id = LessThan(query.where__id__less_than);
    } else if (query.where__id__more_than) {
      where.id = MoreThan(query.where__id__more_than);
    }

    const posts = await this.postsRepository.find({
      where,
      order: {
        createdAt: query.order__createdAt,
      },
      take: query.take,
    });

    // 가져온 포스트가 0개 이상이면 마지막 포스트를 가져오고,
    // 아니면 null 을 반환.
    const lastItem =
      posts.length > 0 && posts.length === query.take
        ? posts[posts.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

    if (nextUrl) {
      /**
       * dto 의 키 값들을 돌면서
       * 키값에 해당되는 value 가 존재하면
       * param 에 그대로 붙여넣는다.
       *
       * 단, where__id_more_than 값만 lastItem 의 id 값
       */
      for (const key of Object.keys(query)) {
        if (query[key]) {
          if (key !== 'where__id__more_than' && 'where__id__less_than') {
            nextUrl.searchParams.append(key, String(query[key]));
          }
        }
      }

      let key: string | null = null;

      if (query.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: posts,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  async pagePaginatePosts(query: BasePaginationDto) {
    /**
     * data: data[],
     * total: number
     * 만 반환해줘도 충분
     */

    const [posts, count] = await this.postsRepository.findAndCount({
      skip: query.take * ((query.page ?? 1) - 1),
      take: query.take,
      order: {
        createdAt: query.order__createdAt,
      },
    });

    return {
      data: posts,
      total: count,
    };
  }

  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의 생성 포스트 ${i}`,
        content: `임의 생성 ${i}번째 포스트`,
        images: [],
      });
    }
  }
  async getPostById(id: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const post = await repository.findOne({
      where: {
        id,
      },
      ...DEFAULT_POST_FIND_OPTIONS,
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostsModel>(PostsModel)
      : this.postsRepository;
  }

  async createPost(authorId: number, postDto: CreatePostDTO, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const post = repository.create({
      ...postDto,
      author: {
        id: authorId,
      },
      likeCount: 0,
      commentCount: 0,
      images: [],
    });

    const newPost = await repository.save(post);

    return newPost;
  }

  async updatePost(postId: number, postDto: UpdatePostDTO) {
    const { title, content } = postDto;

    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(postId);

    return postId;
  }
}
