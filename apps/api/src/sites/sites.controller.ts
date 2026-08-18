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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'lat', type: Number, required: false, description: 'Latitud del punto de referencia' })
  @ApiQuery({ name: 'lng', type: Number, required: false, description: 'Longitud del punto de referencia' })
  @ApiQuery({ name: 'radiusMeters', type: Number, required: false, description: 'Radio de búsqueda en metros (100–200.000)' })
  @ApiQuery({ name: 'siteTypes', type: String, required: false, description: 'Tipos de lugar separados por coma (beach,lagoon,…)' })
  @ApiQuery({ name: 'accessTypes', type: String, required: false, description: 'Accesos separados por coma (public,paid,…)' })
  @ApiQuery({ name: 'amenities', type: String, required: false, description: 'Servicios separados por coma (parking,restrooms,…)' })
  @ApiQuery({ name: 'species', type: String, required: false, description: 'Especies separadas por coma' })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Estado: verified, popular, recent_reports' })
  @ApiQuery({ name: 'q', type: String, required: false, description: 'Texto de búsqueda' })
  @ApiQuery({ name: 'sort', type: String, required: false, enum: ['distance', 'name', 'relevance', 'newest'], description: 'Orden de resultados' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Cantidad por página (default 20)' })
  list(@Query(new ZodValidationPipe(siteListQuerySchema)) query: SiteListQuery) {
    return this.sites.list(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Lugares cerca de un punto (radio en metros, orden por distancia)' })
  @ApiQuery({ name: 'lat', type: Number, required: true, example: -34.6037, description: 'Latitud del punto (EPSG:4326)' })
  @ApiQuery({ name: 'lng', type: Number, required: true, example: -58.3816, description: 'Longitud del punto (EPSG:4326)' })
  @ApiQuery({ name: 'radiusMeters', type: Number, required: false, example: 50000, description: 'Radio en metros (100–200.000)' })
  async nearby(@Query(new ZodValidationPipe(nearbyQuerySchema)) query: NearbyQuery) {
    const rows = await this.search.nearby(query.lat, query.lng, query.radiusMeters, 50);
    return this.search.enrichSummaries(rows);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Búsqueda por texto con ranking de relevancia' })
  @ApiQuery({ name: 'q', type: String, required: true, description: 'Texto a buscar (mínimo 1 carácter)' })
  @ApiQuery({ name: 'lat', type: Number, required: false, description: 'Latitud del punto de referencia' })
  @ApiQuery({ name: 'lng', type: Number, required: false, description: 'Longitud del punto de referencia' })
  @ApiQuery({ name: 'siteTypes', type: String, required: false, description: 'Tipos de lugar separados por coma' })
  @ApiQuery({ name: 'accessTypes', type: String, required: false, description: 'Accesos separados por coma' })
  @ApiQuery({ name: 'amenities', type: String, required: false, description: 'Servicios separados por coma' })
  @ApiQuery({ name: 'species', type: String, required: false, description: 'Especies separadas por coma' })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Estado: verified, popular, recent_reports' })
  @ApiQuery({ name: 'sort', type: String, required: false, enum: ['distance', 'name', 'relevance', 'newest'], description: 'Orden de resultados' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Cantidad por página (default 20)' })
  async searchSites(@Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery) {
    return this.sites.list(query);
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocompletado de nombres/localidades' })
  @ApiQuery({ name: 'q', type: String, required: true, description: 'Texto a autocompletar' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Máximo de sugerencias (1–20, default 8)' })
  autocomplete(@Query(new ZodValidationPipe(autocompleteQuerySchema)) query: AutocompleteQuery) {
    return this.search.autocomplete(query.q, query.limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un lugar' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
  detail(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.sites.detail(id, user?.id);
  }

  @Public()
  @Get(':id/species')
  @ApiOperation({ summary: 'Especies habituales de un lugar' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
  species(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getSpecies(id);
  }

  @Public()
  @Get(':id/amenities')
  @ApiOperation({ summary: 'Servicios de un lugar' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
  amenities(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getAmenities(id);
  }

  @Public()
  @Get(':id/photos')
  @ApiOperation({ summary: 'Fotos aprobadas de un lugar' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
  photos(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sites.getPhotos(id);
  }

  @ApiBearerAuth()
  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir una foto de lugar (queda pendiente de moderación)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
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
