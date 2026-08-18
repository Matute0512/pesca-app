import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  createReportSchema,
  listReportsQuerySchema,
  type CreateReportInput,
  type ListReportsQuery,
} from '@pescaba/shared';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @ApiBearerAuth()
  @Post('sites/:siteId/reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reportar un problema sobre un lugar' })
  @ApiParam({ name: 'siteId', type: String, description: 'UUID del lugar' })
  async create(
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(createReportSchema)) body: CreateReportInput,
  ) {
    return this.reports.create(siteId, user?.id, body.reportType, body.description);
  }

  @ApiBearerAuth()
  @Get('reports/me')
  @ApiOperation({ summary: 'Mis reportes (usuario autenticado)' })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Estado: open, in_review, resolved, rejected' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Cantidad por página (default 20)' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listReportsQuerySchema)) query: ListReportsQuery,
  ) {
    return this.reports.listMine(user.id, query.status, query.page, query.pageSize);
  }
}
