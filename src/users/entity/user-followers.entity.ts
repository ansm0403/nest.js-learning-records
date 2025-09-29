import { BaseModel } from 'src/common/entity/base.entity';
import { UserModel } from './users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class UserFollowersModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.followers)
  follower: UserModel;

  @ManyToOne(() => UserModel, (user) => user.followees)
  followee: UserModel;

  @Column({
    default: false,
  })
  isConfirmed: boolean;
}
