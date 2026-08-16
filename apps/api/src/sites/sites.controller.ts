import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  autocompleteQuerySchema,
  nearbyQuerySchema,
  searchQuerySchema,
  siteListQuerySchema,
  type AutocompleteQuery,
  type NearbyQuery,
  type SearchQuery,
  type SiteListQuery,
} from '@pescaba/shared';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SiteSearchService } from './site-search.service';
import { SitesService } from './sites.service';

@ApiTags('sites')
@Controller('sites')
export class SitesController {
  constructor(
    private readonly sites: SitesService,
    private readonly search: SiteSearchService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar lugares con filtros y paginación' })
  list(@Query(new ZodValidationPipe(siteListQuerySchema)) query: SiteListQuery) {
    return this.sites.list(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Lugares cerca de un punto (radio en metros, orden por distancia)' })
  async nearby(@Query(new ZodValidationPipe(nearbyQuerySchema)) query: NearbyQuery) {
    const rows = await this.search.nearby(query.lat, query.lng, query.radiusMeters, 50);
    return this.search.enrichSummaries(rows);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Búsqueda por texto con ranking de relevancia' })
  async searchSites(@Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery) {
    return this.sites.list(query);
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocompletado de nombres/localidades' })
  autocomplete(@Query(new ZodValidationPipe(autocompleteQuerySchema)) query: AutocompleteQuery) {
    return this.search.autocomplete(query.q, query.limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un lugar' })
  detail(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.sites.detail(id, user?.id);
  }

  @Public()
  @Get(':id/species')
  @ApiOperation({ summary: 'Especies habituales de un lugar' })
  species(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getSpecies(id);
  }

  @Public()
  @Get(':id/amenities')
  @ApiOperation({ summary: 'Servicios de un lugar' })
  amenities(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getAmenities(id);
  }

  @Public()
  @Get(':id/photos')
  @ApiOperation({ summary: 'Fotos aprobadas de un lugar' })
  photos(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getPhotos(id);
  }

  @ApiBearerAuth()
  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir una foto de lugar (queda pendiente de moderación)' })
  async uploadPhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|heic)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!user) {
      throw new BadRequestException('Usuario requerido');
    }
    return this.sites.uploadPhoto(id, user.id, file);
  }
}
