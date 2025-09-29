import { Column, Entity, OneToMany } from 'typeorm';
import { Role } from '../const/roles.const';
import { PostsModel } from 'src/posts/entity/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { Exclude } from 'class-transformer';
import { CommentModel } from 'src/posts/comments/entity/comment.entity';
import { UserFollowersModel } from './user-followers.entity';

@Entity()
export class UserModel extends BaseModel {
  @Column({
    length: 20,
    unique: true,
  })
  @IsString()
  @Length(2, 16, {
    message: '닉네임은 2글자부터 16자 사이로 입력해주세요.',
  })
  nickname: string;

  @Column({
    unique: true,
  })
  @IsString()
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @Length(5, 15, {
    message: '비밀번호는 5 ~ 15 자로 입력해주세요.',
  })
  @Exclude({
    toPlainOnly: true,
  })
  /**
   * Request
   * frontend -> backend 로 보낼 때는 아래와 같다.
   * plain object (JSON) -> class instance (dto)
   *
   * Response
   * 만약 backend -> frontend 로 보낸다면 반대 이다.
   *
   * 이제 Exclude 의 두 옵션을 보자.
   * toClassOnly : class instance 로 변환될때에만 (Request)
   * toPlainOnly : plain object 로 변환될때에만 (Response)
   * 회원가입은 요청 시에는 비밀번호를 서버에 전달해야하니 막으면 안되지만 유저 데이터를 그냥 보여줄 때에는 서버에서 비밀번호 주면 안된다.
   */
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];

  @OneToMany(() => CommentModel, (comment) => comment.author)
  postComments: CommentModel[];

  @OneToMany(() => UserFollowersModel, (ufm) => ufm.follower)
  followers: UserFollowersModel[];

  @OneToMany(() => UserFollowersModel, (ufm) => ufm.followee)
  followees: UserFollowersModel[];

  @Column()
  followerCount: number;

  @Column()
  followeeCount: number;
}
