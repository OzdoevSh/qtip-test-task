import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { User } from '../auth/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CreateArticleDto,
  UpdateArticleDto,
  FilterArticleDto,
} from './dto/article.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepository: Repository<Article>;
  let cacheManager: Cache;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedPassword123',
  } as User;

  const mockArticle = {
    id: 1,
    title: 'Test Article',
    description: 'Test content',
    publicationDate: new Date(),
    author: mockUser,
  } as Article;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articleRepository = module.get<Repository<Article>>(
      getRepositoryToken(Article),
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('findAll', () => {
    it('should return cached articles if available', async () => {
      const cachedData = {
        data: [mockArticle],
        total: 1,
        page: 1,
        last_page: 1,
      };
      (cacheManager.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalled();
      expect(articleRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should query database and cache result if no cache', async () => {
      const filterDto: FilterArticleDto = {};
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (articleRepository.findAndCount as jest.Mock).mockResolvedValue([
        [mockArticle],
        1,
      ]);

      const result = await service.findAll(filterDto, 1, 10);

      expect(result).toEqual({
        data: [mockArticle],
        total: 1,
        page: 1,
        last_page: 1,
      });
      expect(articleRepository.findAndCount).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return cached article if available', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(mockArticle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockArticle);
      expect(cacheManager.get).toHaveBeenCalled();
      expect(articleRepository.findOne).not.toHaveBeenCalled();
    });

    it('should query database and cache result if no cache', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (articleRepository.findOne as jest.Mock).mockResolvedValue(mockArticle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockArticle);
      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['author'],
      });
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article not found', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (articleRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new article and clear cache', async () => {
      const createDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New content',
        publicationDate: new Date(),
      };
      (articleRepository.create as jest.Mock).mockReturnValue(mockArticle);
      (articleRepository.save as jest.Mock).mockResolvedValue(mockArticle);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(mockArticle);
      expect(articleRepository.create).toHaveBeenCalledWith({
        ...createDto,
        author: mockUser,
      });
      expect(cacheManager.del).toHaveBeenCalledWith(
        'articles:{"page":1,"limit":10}',
      );
    });
  });

  describe('update', () => {
    it('should update article and clear cache', async () => {
      const updateDto: UpdateArticleDto = {
        title: 'Updated Title',
        description: 'Updated content',
        publicationDate: new Date(),
      };
      (articleRepository.findOne as jest.Mock).mockResolvedValue(mockArticle);
      (articleRepository.save as jest.Mock).mockResolvedValue({
        ...mockArticle,
        ...updateDto,
      });

      const result = await service.update(1, updateDto, mockUser);

      expect(result).toEqual({ ...mockArticle, ...updateDto });
      expect(articleRepository.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith('article:1');
      expect(cacheManager.del).toHaveBeenCalledWith(
        'articles:{"page":1,"limit":10}',
      );
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const otherUser = { id: 2, username: 'otheruser' } as User;
      (articleRepository.findOne as jest.Mock).mockResolvedValue(mockArticle);

      await expect(
        service.update(
          1,
          {
            title: 'New Title',
            description: '1221',
            publicationDate: new Date(),
          },
          otherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove article and clear cache', async () => {
      (articleRepository.findOne as jest.Mock).mockResolvedValue(mockArticle);
      (articleRepository.remove as jest.Mock).mockResolvedValue(mockArticle);

      const result = await service.remove(1, mockUser);

      expect(result).toEqual(mockArticle);
      expect(articleRepository.remove).toHaveBeenCalledWith(mockArticle);
      expect(cacheManager.del).toHaveBeenCalledWith('article:1');
      expect(cacheManager.del).toHaveBeenCalledWith(
        'articles:{"page":1,"limit":10}',
      );
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const otherUser = { id: 2, username: 'otheruser' } as User;
      (articleRepository.findOne as jest.Mock).mockResolvedValue(mockArticle);

      await expect(service.remove(1, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
