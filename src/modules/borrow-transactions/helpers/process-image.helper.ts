import { BadRequestException, HttpException } from '@nestjs/common';

export async function processImages(images, cloudinaryService) {
  const MAX_FILE_SIZE_MB = 5;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (!images || images.length === 0)
    throw new BadRequestException('At least 1 image is required.');

  if (images.length > 3)
    throw new BadRequestException('Maximum 3 images allowed.');

  for (const img of images) {
    if (img.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new HttpException(
        `Each image max size is ${MAX_FILE_SIZE_MB}MB`,
        413,
      );
    }
    if (!allowedTypes.includes(img.mimetype)) {
      throw new HttpException('Images must be jpg, jpeg, or png', 400);
    }
  }

  const urls: string[] = [];
  for (const img of images) {
    const uploaded = await cloudinaryService.uploadFile(
      img,
      'products/condition',
    );
    urls.push(uploaded.secure_url);
  }

  return urls;
}
