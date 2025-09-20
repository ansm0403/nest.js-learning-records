import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import multer from 'multer';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        // 바이트 단위. 아래는 10MB
        fileSize: 1000000,
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(에러, boolean)
         * 첫 번째 파라미터에는 에러가 있을 경우 에러 정보를 넣어준다.
         * 두 번째 파라미터에는 파일을 받을지 말지 boolean 을 넣어준다.
         * true 면 파일을 다운로드 받게 되고, false 면 파일 다운로드 X
         */

        // xxx.jpg 를 .jpg 만 따와주는 extname 함수
        const ext = extname(file.originalname);

        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(
            new BadRequestException(
              '이미지는 jpg / jpeg / png 파일만 업로드 가능합니다.',
            ),
            false,
          );
        }

        return cb(null, true);
      },
      storage: multer.diskStorage({
        // 파일을 업로드할 때 1차로 보낼 곳
        destination: function (req, res, cb) {
          cb(null, TEMP_FOLDER_PATH);
        },
        filename: function (req, file, cb) {
          // 파일이름을 절대 겹치지 않도록 만듦.
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
