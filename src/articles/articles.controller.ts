import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  FilterArticleDto,
} from './dto/article.dto';
import { Request } from 'express';
import { User } from 'src/auth/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(
    @Query() filterDto: FilterArticleDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.articlesService.findAll(filterDto, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.articlesService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Req() req: Request,
  ) {
    return this.articlesService.create(createArticleDto, req.user as User);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: Request,
  ) {
    return this.articlesService.update(+id, updateArticleDto, req.user as User);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number, @Req() req: Request) {
    return this.articlesService.remove(+id, req.user as User);
  }
}
