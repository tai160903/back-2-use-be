export function extractPublicId(url: string): string | null {
  const regex = /upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function moveImagesToMain(
  tempUrls: Record<string, string>,
  cloudinary,
) {
  const moved: Record<string, string> = {};

  for (const face of Object.keys(tempUrls)) {
    const url = tempUrls[face];
    if (!url) continue;

    const publicId = extractPublicId(url);
    if (!publicId) continue;

    // new location
    const newPublicId = publicId.replace('return-check/', 'return-check/main/');

    const result = await cloudinary.uploader.rename(publicId, newPublicId);

    moved[face] = result.secure_url;
  }

  return moved;
}
