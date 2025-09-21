import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { basename, join } from 'path';
import { ImageModel } from 'src/common/entity/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';
import { CreatePostImageDto } from './dto/create-image.dto';

@Injectable()
export class PostImageService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imageRepository;
  }

  async createPostImage(postDto: CreatePostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    // dto의 이미지 이름을 기반으로 파일 경로 생성
    const tempFilePath = join(TEMP_FOLDER_PATH, postDto.path);

    try {
      // 파일이 존재하는 지 확인
      await promises.access(tempFilePath);
    } catch (err) {
      throw new BadRequestException('존재하지 않는 파일입니다.');
    }
    // 파일의 이름만 가져오기
    const fileName = basename(tempFilePath);

    // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
    const newPath = join(POST_IMAGE_PATH, fileName);

    const result = await repository.save({
      ...postDto,
    });

    //파일 옮기기
    await promises.rename(tempFilePath, newPath);

    return result;
  }
}
