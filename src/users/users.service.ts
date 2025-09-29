import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/users.entity';
import { Repository } from 'typeorm';
import { UserFollowersModel } from './entity/user-followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserModel)
    private readonly usersRepository: Repository<UserModel>,
    @InjectRepository(UserFollowersModel)
    private readonly userFollowersRepository: Repository<UserFollowersModel>,
  ) {}

  async createUser(user: Pick<UserModel, 'email' | 'nickname' | 'password'>) {
    // 닉네임 중복 확인 exist()
    const nicknameExists = await this.usersRepository.exists({
      where: {
        nickname: user.nickname,
      },
    });

    if (nicknameExists) {
      throw new BadRequestException('이미 닉네임이 존재합니다.');
    }

    const emailExists = await this.usersRepository.exists({
      where: {
        email: user.email,
      },
    });

    if (emailExists) {
      throw new BadRequestException('이미 이메일이 존재합니다.');
    }

    const userObject = this.usersRepository.create({
      nickname: user.nickname,
      email: user.email,
      password: user.password,
    });

    const newUser = await this.usersRepository.save(userObject);

    return newUser;
  }

  async getUsers() {
    return this.usersRepository.find({
      relations: {
        followees: true,
        followers: true,
      },
    });
  }

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email,
      },
      relations: {
        followees: true,
      },
    });
  }

  async getFollowers(userId: number, includeNotConfirmed: boolean) {
    const where = {
      followee: {
        id: userId,
      },
    };

    if (!includeNotConfirmed) {
      where['isConfirmed'] = true;
    }

    const result = await this.userFollowersRepository.find({
      where,
      relations: {
        follower: true,
        followee: true,
      },
    });

    return result.map((x) => ({
      id: x.follower.id,
      nickname: x.follower.nickname,
      email: x.follower.email,
      isConfirmed: x.isConfirmed,
    }));
  }

  async followUser(followerId: number, followeeId: number) {
    const result = await this.userFollowersRepository.save({
      follower: {
        id: followerId,
      },
      followee: {
        id: followeeId,
      },
    });

    return true;
  }

  async confirmFollow(followerId: number, followeeId: number) {
    const exist = await this.userFollowersRepository.findOne({
      where: {
        follower: {
          id: followerId,
        },
        followee: {
          id: followeeId,
        },
      },
      relations: {
        follower: true,
        followee: true,
      },
    });

    if (!exist) {
      throw new BadRequestException('존재하지 않는 팔로우 요청입니다.');
    }

    await this.userFollowersRepository.save({
      ...exist,
      isConfirmed: true,
    });

    return true;
  }

  async deleteFollow(followerId: number, followeeId: number) {
    await this.userFollowersRepository.delete({
      follower: {
        id: followerId,
      },
      followee: {
        id: followeeId,
      },
    });

    return true;
  }
}
