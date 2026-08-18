import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  addFavoriteSchema,
  favoritesListQuerySchema,
  type AddFavoriteInput,
  type FavoritesListQuery,
} from '@pescaba/shared';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar favoritos del usuario (por lista)' })
  @ApiQuery({ name: 'listName', type: String, required: false, enum: ['favorites', 'pending', 'visited'], description: 'Lista a consultar (default favorites)' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Cantidad por página (default 20)' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(favoritesListQuerySchema)) query: FavoritesListQuery,
  ) {
    return this.favorites.list(user.id, query.listName, query.page, query.pageSize);
  }

  @Post(':siteId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar un lugar a una lista' })
  @ApiParam({ name: 'siteId', type: String, description: 'UUID del lugar' })
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body(new ZodValidationPipe(addFavoriteSchema)) body: AddFavoriteInput,
  ) {
    return this.favorites.add(user.id, siteId, body.listName);
  }

  @Delete(':siteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar un lugar de las listas' })
  @ApiParam({ name: 'siteId', type: String, description: 'UUID del lugar' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
  ): Promise<void> {
    await this.favorites.remove(user.id, siteId);
  }
}
