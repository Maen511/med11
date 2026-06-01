/** Max upload size for product images in admin catalog */
export const MAX_PRODUCT_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_PRODUCT_IMAGE_MB * 1024 * 1024;

/** Resize/compress before storing in localStorage (avoids quota errors) */
const MAX_STORED_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('read_failed'));
    };
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

function compressDataUrlForStorage(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = MAX_STORED_DIMENSION;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const usePng = mimeType === 'image/png';
      const outputType = usePng ? 'image/png' : 'image/jpeg';
      try {
        resolve(canvas.toDataURL(outputType, usePng ? undefined : JPEG_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error('read_failed'));
    img.src = dataUrl;
  });
}

export async function readProductImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('not_image');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('too_large');
  }
  const dataUrl = await readFileAsDataUrl(file);
  return compressDataUrlForStorage(dataUrl, file.type);
}
