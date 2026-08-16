import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MetadataService } from './metadata.service';

@ApiTags('metadata')
@Controller()
export class MetadataController {
  constructor(private readonly metadata: MetadataService) {}

  @Public()
  @Get('species')
  @ApiOperation({ summary: 'Especies del catálogo' })
  species() {
    return this.metadata.species();
  }

  @Public()
  @Get('site-types')
  @ApiOperation({ summary: 'Tipos de lugar (filtros)' })
  siteTypes() {
    return this.metadata.siteTypes();
  }

  @Public()
  @Get('amenities')
  @ApiOperation({ summary: 'Servicios/amenities (filtros)' })
  amenities() {
    return this.metadata.amenities();
  }

  @Public()
  @Get('regions')
  @ApiOperation({ summary: 'Regiones administrativas' })
  regions() {
    return this.metadata.regions();
  }

  @Public()
  @Get('countries')
  @ApiOperation({ summary: 'Países soportados' })
  countries() {
    return this.metadata.countries();
  }
}
