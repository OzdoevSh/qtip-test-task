import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  Equal,
  FindOptionsWhere,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Article } from './entities/article.entity';
import {
  CreateArticleDto,
  UpdateArticleDto,
  FilterArticleDto,
} from './dto/article.dto';
import { User } from '../auth/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(
    id?: number,
    filterDto?: FilterArticleDto,
    page = 1,
    limit = 10,
  ): string {
    if (id) return `article:${id}`;
    return `articles:${JSON.stringify({ filterDto, page, limit })}`;
  }

  // инвалидация кэша
  private async clearAllArticlesCache(articleId?: number) {
    const keys = [
      this.getCacheKey(), // основной ключ без параметров
      ...Array.from(
        { length: 10 },
        (_, i) => this.getCacheKey(undefined, {}, i + 1, 10), // первые 10 страниц
      ),
    ];

    if (articleId) {
      keys.push(this.getCacheKey(articleId));
    }

    await Promise.all(keys.map((k) => this.cacheManager.del(k)));
  }

  // получение всех статей
  async findAll(filterDto: FilterArticleDto, page = 1, limit = 10) {
    const cacheKey = this.getCacheKey(undefined, filterDto, page, limit);
    const cached = await this.cacheManager.get<{
      data: Article[];
      total: number;
      page: number;
      last_page: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: FindOptionsWhere<Article> = {};

    // фильтрация по автору
    if (filterDto.author) {
      where.author = { id: Equal(Number(filterDto.author)) };
    }

    // фильтрация по дате
    if (filterDto.startDate && !filterDto.endDate) {
      where.publicationDate = MoreThanOrEqual(new Date(filterDto.startDate));
    } else if (!filterDto.startDate && filterDto.endDate) {
      where.publicationDate = LessThanOrEqual(new Date(filterDto.endDate));
    } else if (filterDto.startDate && filterDto.endDate) {
      where.publicationDate = Between(
        new Date(filterDto.startDate),
        new Date(filterDto.endDate),
      );
    }

    const [articles, total] = await this.articleRepository.findAndCount({
      where,
      relations: ['author'],
      skip: (page - 1) * limit,
      take: limit,
      order: { publicationDate: 'DESC' },
    });

    const result = {
      data: articles,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  // получение одной статьи
  async findOne(id: number) {
    const cacheKey = this.getCacheKey(id);
    const cached = await this.cacheManager.get<Article>(cacheKey);
    if (cached) return cached;

    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, article, 5 * 60 * 1000);
    return article;
  }

  // создание статьи
  async create(createArticleDto: CreateArticleDto, user: User) {
    const article = this.articleRepository.create({
      ...createArticleDto,
      author: user,
    });
    const savedArticle = await this.articleRepository.save(article);
    await this.clearAllArticlesCache();
    return savedArticle;
  }

  // редактирование статьи
  async update(id: number, updateArticleDto: UpdateArticleDto, user: User) {
    const article = await this.findOne(id);
    if (article.author.id !== user.id) {
      throw new ForbiddenException('You can only update your own articles');
    }

    Object.assign(article, updateArticleDto);
    const updatedArticle = await this.articleRepository.save(article);
    await this.clearAllArticlesCache(id);
    return updatedArticle;
  }

  // удаление статьи
  async remove(id: number, user: User) {
    const article = await this.findOne(id);
    if (article.author.id !== user.id) {
      throw new ForbiddenException('You can only delete your own articles');
    }
    await this.articleRepository.remove(article);
    await this.clearAllArticlesCache(id);
    return article;
  }
}
