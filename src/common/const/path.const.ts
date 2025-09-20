import { join } from 'path';

export const PROJECT_ROOT_PATH = process.cwd();
// 외부에서 접근 가능해도 되는 파일들을 모아둔 폴더 이름
export const PUBLIC_FOLDER_NAME = 'public';
// 포스트 이미지들을 저장할 폴더 이름
export const POSTS_FOLDER_NAME = 'posts';

// 이미지 업로드 임시 폴더 경로
export const TEMP_FOLDER_NAME = 'temp';

// 실제 공개 폴더의 절대경로
// /{프로젝트 위치}/public

export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 포스트 이미지들을 저장할 폴더

export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

// 이미지의 위치를 get 요청에 담아서 보낼 떄에는 절대경로가 아닌 /public/posts/xxx.jpg 이런 식으로 보내줄 것.
// 여기다 http://localhost:3000 을 붙여서 요청하면 업로드한 이미지를 볼 수 있도록
// 우선 /public/posts/ 이것만 만듬.
export const POST_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  POSTS_FOLDER_NAME,
);

// 임시 파일들을 저장할 폴더
export const TEMP_FOLDER_PATH = join(PUBLIC_FOLDER_PATH, TEMP_FOLDER_NAME);
