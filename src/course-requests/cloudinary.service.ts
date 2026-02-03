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
    const upload_preset = 'eduverse_preset'; // ✅ პრესეტის დასახელება

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        upload_preset: upload_preset, // ✅ ხელმოწერა იქმნება პრესეტის გათვალისწინებით
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      upload_preset, // ვაბრუნებთ, რომ ფრონტენდმაც გამოიყენოს
    };
  }

  async deleteImage(imageUrl: string) {
    try {
      const splitUrl = imageUrl.split('/');
      const lastPart = splitUrl[splitUrl.length - 1];
      const folder = splitUrl[splitUrl.length - 2];
      const publicId = `${folder}/${lastPart.split('.')[0]}`;

      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new InternalServerErrorException('ფაილის წაშლა Cloudinary-დან ვერ მოხერხდა');
    }
  }
}