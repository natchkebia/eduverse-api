import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../course-requests/cloudinary.service';
import { UpsertSiteReviewDto } from './dto/upsert-site-review.dto';

@Injectable()
export class SiteReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  getUploadSignature() {
    return this.cloudinaryService.getUploadSignature('eduverse_reviews');
  }

  getPublishedReviews(limit = 12) {
    const take = Math.min(Math.max(limit, 1), 50);

    return this.prisma.siteReview.findMany({
      where: { published: true },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });
  }

  getMyReview(userId: string) {
    return this.prisma.siteReview.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });
  }

  upsertMyReview(userId: string, dto: UpsertSiteReviewDto) {
    const comment = dto.comment.trim();
    if (!comment) {
      throw new BadRequestException('Review comment is required');
    }

    return this.prisma.siteReview.upsert({
      where: { userId },
      create: {
        userId,
        rating: dto.rating,
        comment,
        photoUrl: dto.photoUrl ?? null,
        published: false,
      },
      update: {
        rating: dto.rating,
        comment,
        photoUrl: dto.photoUrl ?? null,
        published: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteMyReview(userId: string) {
    const review = await this.prisma.siteReview.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.siteReview.delete({ where: { id: review.id } });
    return { success: true };
  }

  getAllReviews() {
    return this.prisma.siteReview.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updatePublication(id: string, published: boolean) {
    await this.ensureReviewExists(id);

    return this.prisma.siteReview.update({
      where: { id },
      data: { published },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteReview(id: string) {
    await this.ensureReviewExists(id);
    await this.prisma.siteReview.delete({ where: { id } });
    return { success: true };
  }

  private async ensureReviewExists(id: string) {
    const review = await this.prisma.siteReview.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!review) throw new NotFoundException('Review not found');
  }
}
