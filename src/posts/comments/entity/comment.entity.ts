import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { PostsModel } from 'src/posts/entity/posts.entity';
import { UserModel } from 'src/users/entity/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class CommentModel extends BaseModel {
  @ManyToOne(() => UserModel, (author) => author.postComments)
  author: UserModel;

  @ManyToOne(() => PostsModel, (post) => post.comments)
  post: PostsModel;

  @Column()
  @IsString()
  comment: string;

  @Column({
    default: 0,
  })
  @IsNumber()
  likeCount: number;
}
