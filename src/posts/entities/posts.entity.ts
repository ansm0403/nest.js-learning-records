import { BaseModel } from 'src/common/entity/base.entity';
import { UserModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { join } from 'path';

@Entity()
export class PostsModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.posts, {
    nullable: false,
  })
  author: UserModel;

  @Column()
  @IsString({
    message: 'title은 string 타입이 필요합니다.',
  })
  title: string;

  @Column()
  @IsString()
  content: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;

  @Column({
    nullable: true,
  })
  @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  image?: string;
}
