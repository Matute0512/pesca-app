import { Injectable, NotFoundException } from '@nestjs/common';
import type { ReportType } from '@prisma/client';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea un reporte de problema sobre un lugar. */
  async create(siteId: string, userId: string | undefined, reportType: ReportType, description?: string | null) {
    const site = await this.prisma.fishingSite.findFirst({
      where: { id: siteId, isActive: true, deletedAt: null },
    });
    if (!site) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Lugar no encontrado',
        code: ErrorCode.SITE_NOT_FOUND,
      });
    }
    return this.prisma.siteReport.create({
      data: { siteId, userId, reportType, description: description ?? null },
      select: {
        id: true,
        siteId: true,
        reportType: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /** Reportes creados por el usuario autenticado. */
  async listMine(userId: string, status?: string, page = 1, pageSize = 20) {
    const where = { userId, ...(status ? { status: status as never } : {}) };
    const [reports, total] = await Promise.all([
      this.prisma.siteReport.findMany({
        where,
        include: { site: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.siteReport.count({ where }),
    ]);
    return { data: reports, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
}
