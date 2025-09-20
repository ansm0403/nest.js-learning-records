import { BaseModel } from 'src/common/entity/base.entity';
import { UserModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { IsString } from 'class-validator';
import { ImageModel } from 'src/common/entity/image.entity';

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

  @OneToMany((type) => ImageModel, (image) => image.post)
  images: ImageModel[];
}
