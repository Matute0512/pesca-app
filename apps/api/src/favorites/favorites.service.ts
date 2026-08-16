import { Injectable, NotFoundException } from '@nestjs/common';
import type { FavoriteListName, SiteSummary } from '@pescaba/shared';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { toSiteSummary } from '../sites/site.mapper';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    listName?: FavoriteListName,
    page = 1,
    pageSize = 20,
  ): Promise<{ data: SiteSummary[]; total: number; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const where = { userId, ...(listName ? { listName } : {}) };

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        include: {
          site: {
            include: {
              species: { select: { species: { select: { slug: true, commonNameEs: true } } } },
              amenities: true,
              photos: {
                where: { isCover: true, moderationStatus: 'approved' },
                select: { url: true, thumbnailUrl: true, caption: true, isCover: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.favorite.count({ where }),
    ]);

    return {
      data: favorites.map((f) => toSiteSummary(f.site)),
      total,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** Agrega un lugar a una lista. Si ya está en otra lista, la mueve (upsert). */
  async add(userId: string, siteId: string, listName: FavoriteListName) {
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
    return this.prisma.favorite.upsert({
      where: { userId_siteId: { userId, siteId } },
      create: { userId, siteId, listName },
      update: { listName },
    });
  }

  async remove(userId: string, siteId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, siteId } });
  }
}
