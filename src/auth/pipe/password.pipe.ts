import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class PasswordPipe implements PipeTransform<string, string> {
  /**
   *
   * @param value 는 컨트롤러의 @Param('id', ParseIntPipe) 라는 예시에서 'id'를 의미.
   * localhost:3000/auth/1 이라면 id 에 1이 들어가고 value 가 1 이 된다.
   * @param metadata
   * @returns
   */
  transform(value: string, metadata: ArgumentMetadata) {
    if (value.toString().length > 0) {
      throw new BadRequestException('비밀번호를 8자 이하로 입력해주세요.');
    }
    return value.toString();
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: string, metadata: ArgumentMetadata) {
    if (value.toString().length > this.length) {
      throw new BadRequestException(`최대 길이는 ${this.length} 입니다.`);
    }

    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: string, metadata: ArgumentMetadata) {
    if (value.toString().length < this.length) {
      throw new BadRequestException(`최소 길이는 ${this.length} 입니다.`);
    }

    return value.toString();
  }
}
