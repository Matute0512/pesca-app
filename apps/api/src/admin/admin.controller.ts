import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  createSiteSchema,
  reviewReportSchema,
  reviewSuggestionSchema,
  updateSiteSchema,
  updateUserAdminSchema,
  type CreateSiteInput,
  type ReviewReportInput,
  type ReviewSuggestionInput,
  type UpdateSiteInput,
  type UpdateUserAdminInput,
} from '@pescaba/shared';
import { z } from 'zod';
import type { Request } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { type AuditContext } from './admin.service';
import { ImportService } from './import.service';

const speciesCreateSchema = z.object({
  slug: z.string().min(2).max(80),
  commonNameEs: z.string().min(2).max(120),
  commonNameEn: z.string().max(120).nullish(),
  scientificName: z.string().min(2).max(200),
  category: z.enum(['baitfish', 'sport', 'predator', 'commercial']),
});

const regionCreateSchema = z.object({
  countryCode: z.string().length(2),
  adminLevel1: z.string().max(120).nullish(),
  adminLevel2: z.string().max(120).nullish(),
  adminLevel3: z.string().max(120).nullish(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
});

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@Roles('moderator', 'editor', 'admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly importService: ImportService,
    private readonly prisma: PrismaService,
  ) {}

  private auditCtx(req: Request, user: AuthenticatedUser): AuditContext {
    return { userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  }

  // ────────────────────────────────────────────── Dashboard

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen para el panel' })
  dashboard() {
    return this.admin.dashboard();
  }

  // ────────────────────────────────────────────── Sites

  @Get('sites')
  @ApiOperation({ summary: 'Listar lugares (admin)' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Cantidad por página (default 20)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Buscar por nombre' })
  listSites(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.admin.listSites(Number(page) || 1, Number(pageSize) || 20, search, true);
  }

  @Post('sites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear lugar' })
  createSite(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSiteSchema)) body: CreateSiteInput,
  ) {
    return this.admin.createSite(body, this.auditCtx(req, user));
  }

  @Get('sites/:id')
  @ApiOperation({ summary: 'Detalle de lugar (admin)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lugar' })
  getSite(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.getSite(id);
  }

  @Patch('sites/:id')
  @ApiOperation({ summary: 'Actualizar lugar' })
  updateSite(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateSiteSchema)) body: UpdateSiteInput,
  ) {
    return this.admin.updateSite(id, body, this.auditCtx(req, user));
  }

  @Delete('sites/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar lugar (soft delete)' })
  async deleteSite(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.admin.deleteSite(id, this.auditCtx(req, user));
  }

  @Post('sites/:id/verify')
  @ApiOperation({ summary: 'Marcar lugar como verificado' })
  verifySite(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.admin.verifySite(id, this.auditCtx(req, user));
  }

  @Post('sites/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar lugares desde CSV o GeoJSON' })
  @ApiQuery({ name: 'dryRun', type: String, required: false, enum: ['true', 'false'], description: 'true para validar sin escribir (default false)' })
  importSites(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun?: string,
  ) {
    return this.importService.importFile(file, dryRun === 'true', user.id);
  }

  // ────────────────────────────────────────────── Suggestions

  @Get('suggestions')
  @ApiOperation({ summary: 'Listar sugerencias de lugares' })
  @ApiQuery({ name: 'status', type: String, required: false, enum: ['pending', 'approved', 'rejected'], description: 'Filtrar por estado' })
  listSuggestions(@Query('status') status?: string) {
    return this.admin.listSuggestions(status);
  }

  @Patch('suggestions/:id')
  @ApiOperation({ summary: 'Aprobar o rechazar una sugerencia' })
  reviewSuggestion(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(reviewSuggestionSchema)) body: ReviewSuggestionInput,
  ) {
    return this.admin.reviewSuggestion(id, body.decision, body.rejectionReason, this.auditCtx(req, user));
  }

  // ────────────────────────────────────────────── Reports

  @Get('reports')
  @ApiOperation({ summary: 'Listar reportes de problemas' })
  @ApiQuery({ name: 'status', type: String, required: false, enum: ['open', 'in_review', 'resolved', 'rejected'], description: 'Filtrar por estado' })
  listReports(@Query('status') status?: string) {
    return this.admin.listReports(status);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Moderar un reporte' })
  reviewReport(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(reviewReportSchema)) body: ReviewReportInput,
  ) {
    return this.admin.reviewReport(id, body.decision, this.auditCtx(req, user));
  }

  // ────────────────────────────────────────────── Users (admin)

  @Roles('admin')
  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Buscar por email o username' })
  listUsers(@Query('search') search?: string) {
    return this.admin.listUsers(search);
  }

  @Roles('admin')
  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar usuario (roles, verificación)' })
  updateUser(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateUserAdminSchema)) body: UpdateUserAdminInput,
  ) {
    return this.admin.updateUser(id, body, this.auditCtx(req, user));
  }

  @Roles('admin')
  @Get('audit-logs')
  @ApiOperation({ summary: 'Auditoría de acciones administrativas' })
  auditLogs() {
    return this.admin.listAuditLogs();
  }

  // ────────────────────────────────────────────── Species

  @Get('species')
  @ApiOperation({ summary: 'Listar especies (admin)' })
  species() {
    return this.prisma.species.findMany({ orderBy: { commonNameEs: 'asc' } });
  }

  @Post('species')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear especie' })
  createSpecies(@Body(new ZodValidationPipe(speciesCreateSchema)) body: z.infer<typeof speciesCreateSchema>) {
    return this.admin.createSpecies(body);
  }

  @Patch('species/:id')
  @ApiOperation({ summary: 'Actualizar especie' })
  updateSpecies(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(speciesCreateSchema.partial())) body: Partial<z.infer<typeof speciesCreateSchema>>,
  ) {
    return this.admin.updateSpecies(id, body);
  }

  @Delete('species/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar especie' })
  async deleteSpecies(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.admin.deleteSpecies(id);
  }

  // ────────────────────────────────────────────── Regions

  @Get('regions')
  @ApiOperation({ summary: 'Listar regiones' })
  regions() {
    return this.admin.listRegions();
  }

  @Post('regions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear región' })
  createRegion(@Body(new ZodValidationPipe(regionCreateSchema)) body: z.infer<typeof regionCreateSchema>) {
    return this.admin.createRegion(body);
  }
}
