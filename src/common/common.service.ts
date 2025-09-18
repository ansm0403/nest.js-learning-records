import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseModel } from './entity/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}
  /**
   * 페이지네이션 일반화
   */
  paginate<T extends BaseModel>(
    query: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (query.page) {
      return this.pagePaginate(query, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(query, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    query: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(query);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });

    return {
      data,
      total: count,
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    query: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    /**
     * where__id__more_than 으로 만들어놨지만
     * 만약 where__likeCount__more_than 으로 페이지네이션 하고 싶다면?
     *
     * 또는 특정 제목을 포함한 글들만 보여주고 싶다면?
     * where__title__ilike
     */

    const findOptions = this.composeFindOptions<T>(query);

    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions,
    });

    const lastItem =
      results.length > 0 && results.length === query.take
        ? results[results.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);

    if (nextUrl) {
      /**
       * dto 의 키 값들을 돌면서
       * 키값에 해당되는 value 가 존재하면
       * param 에 그대로 붙여넣는다.
       *
       * 단, where__id_more_than 값만 lastItem 의 id 값
       */
      for (const key of Object.keys(query)) {
        if (query[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, query[key]);
          }
        }
      }

      let key: string | null = null;

      if (query.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    console.log('result: ', results);

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  private composeFindOptions<T extends BaseModel>(
    query: BasePaginationDto,
  ): FindManyOptions<T> {
    /**
     * 반환값
     * where,
     * order,
     * take,
     * skip <- 페이지 기반일 때만
     */
    /**
     * DTO의 현재 생긴 구조는 아래와 같다.
     *
     * {
     *  where__id__more_than : 1,
     *  order__createdAt: 'ASC'
     * }
     *
     * 하지만 order나 where가 여러개 추가될 수 있다.
     *
     * 현재는 where__id__more_than 에만 해당되는 whrer 필터만 사용중이지만
     * 나중에 where__likeCount__more_than 등의 추가 필터가 필요할 수 있다.
     * 그렇기에 모든 where 필터들을 자동으로 파싱할 수 있을만한 기능을 제작해야한다.
     *
     * 1. where 로 시작한다면 필터로직 적용
     * 2. order 로 시작한다면 정렬로직 적용
     * 3. 필터 로직을 적용한다면 '__' 기준으로 split 했을 때 3개의 값으로 나뉘는지 2개의 값으로 나뉘는지 확인한다.
     * 3-1. 3개의 값으로 나뉜다면 FILTER_MAPPER 에서 해당되는 operator 함수를 찾아서 적용한다.
     *      ex) ['where', 'id', 'more_than']
     * 3-2. 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용한다.
     *      ex) more_than 같은 것 없이 특정값을 필터링 하고 싶다.
     *          ['where', 'id']
     *          more_than 같은 조건없이 id 에 해당하는 값만 필터링
     * 4. order 의 경우 3-2 와 같이 적용
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(query) as [
      string,
      string | number,
    ][]) {
      // key -> where__id__less_than 라면
      // value -> 1

      if (value === undefined || value === null) continue;
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    console.log('query : ', {
      where,
      order,
      take: query.take,
      skip: query.page ? query.take * (query.page - 1) : undefined,
    });

    return {
      where,
      order,
      take: query.take,
      skip: query.page ? query.take * (query.page - 1) : undefined,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: string | number,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를 들어 where__id__more_than 을 __ 기준으로 나눈다.
     *
     * ['where', 'id', 'more_than']
     */
    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException('잘못된 where 쿼리 입니다.');
    }

    /**
     * 길이가 2인 경우는 where__id = 3 과 같은 형태
     *
     * findOptionsWhere로 풀어보면 아래와 같다.
     *
     * {
     *   where: {
     *      id : 3,
     *   }
     * }
     */

    if (split.length === 2) {
      // field -> id
      const [_, field] = split;

      // options[field] = value; 는 아래와 같다.
      // {
      //  id : 3,
      // }
      options[field] = value;
    } else {
      /**
       * 길이가 3인 경우는 more_than 과 같은 typeorm 유틸리티가 필요한 경우.
       *
       * FILTER_MAPPER 에 미리 정의해둔 값들로
       * field 값에 FILTER_MAPPER 에서 해당되는 유틸리티를 가져온 후 값에 적용
       */

      const [_, field, operator] = split;

      // 기본적으로 where__id__more_than = 1 은
      // id 1보다 큰 애들만 가져오는 것이니 값이 1 하나만 필요하다.
      // 하지만 예를 들어 where__id__between = 3, 4 의 경우는 Between 이라는 typeorm 유틸리티가 매개변수로 2개를 요구한다.
      // 그래서 3,4 처럼 콤마를 기준으로 split 해서 값을 가져올 것이다.
      const values = String(value).split(',');

      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}%`);
        console.log('where : ', split, value, FILTER_MAPPER[operator]);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
        console.log('where : ', split, value, FILTER_MAPPER[operator]);
      }
    }

    return options;
  }
}
