import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  getUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'eduverse_courses';

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    };
  }

  // ✅ ახალი მეთოდი: სურათის წაშლა Cloudinary-დან
  async deleteImage(imageUrl: string) {
    try {
      // ამოვიღოთ public_id URL-დან (მაგ: eduverse_courses/abc12345)
      const splitUrl = imageUrl.split('/');
      const lastPart = splitUrl[splitUrl.length - 1]; // image.jpg
      const folder = splitUrl[splitUrl.length - 2];   // eduverse_courses
      const publicId = `${folder}/${lastPart.split('.')[0]}`;

      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new InternalServerErrorException('ფაილის წაშლა Cloudinary-დან ვერ მოხერხდა');
    }
  }
}