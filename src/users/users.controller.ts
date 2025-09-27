import { Body, Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from './decorator/roles.decorator';
import { Role } from './const/roles.const';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  /**
   * serialization 은? 직렬화
   * 직렬화는? 현재 시스템( Nestjs )에서 사용되는 데이터의 구조를 다른 시스템에서도 쉽게 사용할 수 있는 퐷으로 변환.
   * 현재 상황에서는 class의 object 에서 JSON 포맷으로 변환
   * deserialization 은 반대
   * 아래의 getUsers 의 반환값은 UsersModel 클래스의 인스턴스이다.
   * 이 값이 응답으로 반환되면서 JSON 으로 자동으로 바뀔 때 클래스를 직렬화 해주는 것이 ClassSerializerInterceptor 이다.
   */
  getUsers() {
    return this.usersService.getUsers();
  }
}
