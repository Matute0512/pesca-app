import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SpeciesCategory } from '@prisma/client';
import type { Role } from '@pescaba/shared';
import { AuditService } from '../audit/audit.service';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from '../sites/sites.service';
import { type CreateSiteInput } from '../sites/sites.service';

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sites: SitesService,
    private readonly audit: AuditService,
  ) {}

  // ────────────────────────────────────────────── Dashboard

  async dashboard() {
    const [totalSites, verifiedSites, pendingSuggestions, openReports, totalUsers, totalPhotos] =
      await Promise.all([
        this.prisma.fishingSite.count({ where: { deletedAt: null } }),
        this.prisma.fishingSite.count({ where: { isVerified: true, deletedAt: null } }),
        this.prisma.siteSuggestion.count({ where: { status: 'pending' } }),
        this.prisma.siteReport.count({ where: { status: 'open' } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.sitePhoto.count({ where: { moderationStatus: 'pending' } }),
      ]);
    return {
      totalSites,
      verifiedSites,
      pendingSuggestions,
      openReports,
      totalUsers,
      pendingPhotos: totalPhotos,
    };
  }

  // ────────────────────────────────────────────── Sites (admin)

  async listSites(page = 1, pageSize = 20, search?: string, includeInactive = false) {
    const where = {
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(includeInactive ? {} : { deletedAt: null }),
    };
    const [sites, total] = await Promise.all([
      this.prisma.fishingSite.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { species: { select: { species: { select: { slug: true } } } } },
      }),
      this.prisma.fishingSite.count({ where }),
    ]);
    return { data: sites, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async getSite(id: string) {
    const site = await this.prisma.fishingSite.findUnique({
      where: { id },
      include: {
        species: { include: { species: true } },
        amenities: true,
        photos: { orderBy: { createdAt: 'desc' } },
        reports: { orderBy: { createdAt: 'desc' }, take: 10 },
        createdByUser: { select: { id: true, email: true, username: true } },
      },
    });
    if (!site) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Lugar no encontrado',
        code: ErrorCode.SITE_NOT_FOUND,
      });
    }
    return site;
  }

  async createSite(data: CreateSiteInput, ctx: AuditContext) {
    const site = await this.sites.create(data, ctx.userId);
    await this.audit.log({
      userId: ctx.userId,
      action: 'site.create',
      entityType: 'fishing_site',
      entityId: site.id,
      after: { name: site.name, siteType: site.siteType },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return site;
  }

  async updateSite(id: string, data: Partial<CreateSiteInput>, ctx: AuditContext) {
    const before = await this.prisma.fishingSite.findUnique({ where: { id } });
    const site = await this.sites.update(id, data, ctx.userId);
    await this.audit.log({
      userId: ctx.userId,
      action: 'site.update',
      entityType: 'fishing_site',
      entityId: id,
      before: before ? { name: before.name } : undefined,
      after: { name: site?.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return site;
  }

  async deleteSite(id: string, ctx: AuditContext): Promise<void> {
    await this.sites.remove(id, ctx.userId);
    await this.audit.log({
      userId: ctx.userId,
      action: 'site.delete',
      entityType: 'fishing_site',
      entityId: id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  async verifySite(id: string, ctx: AuditContext) {
    const site = await this.sites.verify(id, ctx.userId);
    await this.audit.log({
      userId: ctx.userId,
      action: 'site.verify',
      entityType: 'fishing_site',
      entityId: id,
      after: { verified: true },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return site;
  }

  // ────────────────────────────────────────────── Suggestions moderation

  async listSuggestions(status?: string, page = 1, pageSize = 20) {
    const where = status ? { status: status as never } : {};
    const [suggestions, total] = await Promise.all([
      this.prisma.siteSuggestion.findMany({
        where,
        include: { user: { select: { id: true, email: true, username: true } } },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.siteSuggestion.count({ where }),
    ]);
    return { data: suggestions, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async reviewSuggestion(
    id: string,
    decision: 'approved' | 'rejected',
    rejectionReason: string | null | undefined,
    ctx: AuditContext,
  ) {
    const suggestion = await this.prisma.siteSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Sugerencia no encontrada',
        code: ErrorCode.SUGGESTION_NOT_FOUND,
      });
    }

    const updated = await this.prisma.siteSuggestion.update({
      where: { id },
      data: {
        status: decision,
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
        rejectionReason: decision === 'rejected' ? rejectionReason ?? 'Sin motivo especificado' : null,
      },
    });

    // Al aprobar una sugerencia, se crea el lugar (marcado como no verificado).
    let createdSiteId: string | undefined;
    if (decision === 'approved') {
      const site = await this.sites.create(
        {
          name: suggestion.name,
          siteType: suggestion.siteType,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          addressLine: suggestion.addressLine,
          locality: suggestion.locality,
          municipality: suggestion.municipality,
          province: suggestion.province,
          countryCode: suggestion.countryCode,
          phone: suggestion.phone,
          website: suggestion.website,
          descriptionShort: suggestion.description,
          source: 'user_suggestion',
        },
        ctx.userId,
      );
      createdSiteId = site.id;
    }

    await this.audit.log({
      userId: ctx.userId,
      action: `suggestion.${decision}`,
      entityType: 'site_suggestion',
      entityId: id,
      after: { decision, createdSiteId },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { ...updated, createdSiteId };
  }

  // ────────────────────────────────────────────── Reports moderation

  async listReports(status?: string, page = 1, pageSize = 20) {
    const where = status ? { status: status as never } : {};
    const [reports, total] = await Promise.all([
      this.prisma.siteReport.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.siteReport.count({ where }),
    ]);
    return { data: reports, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async reviewReport(id: string, decision: 'in_review' | 'resolved' | 'rejected', ctx: AuditContext) {
    const report = await this.prisma.siteReport.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Reporte no encontrado',
        code: ErrorCode.REPORT_NOT_FOUND,
      });
    }
    const updated = await this.prisma.siteReport.update({
      where: { id },
      data: {
        status: decision,
        resolvedAt: decision === 'resolved' || decision === 'rejected' ? new Date() : report.resolvedAt,
        resolvedBy: decision === 'resolved' || decision === 'rejected' ? ctx.userId : report.resolvedBy,
      },
    });
    await this.audit.log({
      userId: ctx.userId,
      action: `report.${decision}`,
      entityType: 'site_report',
      entityId: id,
      after: { decision },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  // ────────────────────────────────────────────── Users (admin only)

  async listUsers(search?: string, page = 1, pageSize = 20) {
    const where = {
      deletedAt: null,
      ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { username: { contains: search, mode: 'insensitive' as const } }] } : {}),
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          emailVerified: true,
          preferredLanguage: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async updateUser(id: string, data: { role?: Role; fullName?: string | null; emailVerified?: boolean }, ctx: AuditContext) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Usuario no encontrado',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }
    if (user.role === 'ADMIN' && data.role && data.role !== 'admin' && user.id === ctx.userId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No podés quitarte el rol de administrador',
        code: ErrorCode.VALIDATION_FAILED,
      });
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: data.role ? (data.role.toUpperCase() as never) : undefined,
        fullName: data.fullName === undefined ? undefined : data.fullName,
        emailVerified: data.emailVerified,
      },
      select: { id: true, email: true, username: true, fullName: true, role: true, emailVerified: true },
    });
    await this.audit.log({
      userId: ctx.userId,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      before: { role: user.role },
      after: { role: updated.role },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  // ────────────────────────────────────────────── Audit

  async listAuditLogs(page = 1, pageSize = 20) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { id: true, email: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { data: logs, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  // ────────────────────────────────────────────── Species / Regions CRUD

  async createSpecies(data: {
    slug: string;
    commonNameEs: string;
    commonNameEn?: string | null;
    scientificName: string;
    category: string;
  }) {
    return this.prisma.species.create({
      data: {
        slug: data.slug,
        commonNameEs: data.commonNameEs,
        commonNameEn: data.commonNameEn ?? undefined,
        scientificName: data.scientificName,
        category: data.category as SpeciesCategory,
      },
    });
  }

  async updateSpecies(
    id: string,
    data: Partial<{
      slug: string;
      commonNameEs: string;
      commonNameEn?: string | null;
      scientificName: string;
      category: string;
      isActive: boolean;
    }>,
  ) {
    const { category, commonNameEn, ...rest } = data;
    return this.prisma.species.update({
      where: { id },
      data: {
        ...rest,
        ...(commonNameEn !== undefined ? { commonNameEn: commonNameEn ?? null } : {}),
        ...(category ? { category: category as SpeciesCategory } : {}),
      },
    });
  }

  async deleteSpecies(id: string): Promise<void> {
    await this.prisma.species.delete({ where: { id } });
  }

  async listRegions(page = 1, pageSize = 50) {
    const [regions, total] = await Promise.all([
      this.prisma.region.findMany({ orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.region.count(),
    ]);
    return { data: regions, total };
  }

  async createRegion(data: {
    countryCode: string;
    adminLevel1?: string | null;
    adminLevel2?: string | null;
    adminLevel3?: string | null;
    name: string;
    slug: string;
  }) {
    return this.prisma.region.create({
      data: {
        countryCode: data.countryCode,
        adminLevel1: data.adminLevel1 ?? undefined,
        adminLevel2: data.adminLevel2 ?? undefined,
        adminLevel3: data.adminLevel3 ?? undefined,
        name: data.name,
        slug: data.slug,
      },
    });
  }
}
