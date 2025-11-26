import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';

export async function processImages(
  images: {
    frontImage?: Express.Multer.File[];
    backImage?: Express.Multer.File[];
    leftImage?: Express.Multer.File[];
    rightImage?: Express.Multer.File[];
    topImage?: Express.Multer.File[];
    bottomImage?: Express.Multer.File[];
  },
  cloudinaryService: CloudinaryService,
) {
  const uploaded: Record<string, string> = {};

  for (const face of Object.keys(images)) {
    const fileArray = images[face];
    if (fileArray && fileArray.length > 0) {
      const file = fileArray[0];

      // Cloudinary requires folder
      const uploadedFile = await cloudinaryService.uploadFile(
        file,
        'return-check',
      );

      // Save secure_url only
      uploaded[face] = uploadedFile.secure_url;
    }
  }

  return uploaded;
}
