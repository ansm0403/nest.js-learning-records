import { Column, Entity, OneToMany } from 'typeorm';
import { Role } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';

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
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
