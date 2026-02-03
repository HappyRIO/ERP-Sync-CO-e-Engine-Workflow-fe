// Image compression utilities for frontend
import imageCompression from 'browser-image-compression';

// Maximum file size: 15MB
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

// Compression options for photos (evidence photos)
export const PHOTO_COMPRESSION_OPTIONS: imageCompression.Options = {
  maxSizeMB: 2, // Target size: 2MB (will compress to fit within this)
  maxWidthOrHeight: 1920, // Maximum width or height
  useWebWorker: true, // Use web worker for better performance
  fileType: 'image/jpeg', // Convert to JPEG for better compression
  initialQuality: 0.85, // Initial quality (0-1)
  alwaysKeepResolution: false, // Allow resizing if needed
};

// Compression options for signatures (smaller, simpler images)
export const SIGNATURE_COMPRESSION_OPTIONS: imageCompression.Options = {
  maxSizeMB: 0.5, // Target size: 500KB (signatures are simpler)
  maxWidthOrHeight: 1920, // Maximum width or height
  useWebWorker: true,
  fileType: 'image/png', // Keep PNG for signatures (transparency support)
  initialQuality: 0.9, // Higher quality for signatures
  alwaysKeepResolution: false,
};

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options (defaults to photo options)
 * @returns Compressed file as base64 data URL
 */
export async function compressImage(
  file: File,
  options: imageCompression.Options = PHOTO_COMPRESSION_OPTIONS
): Promise<string> {
  try {
    // Check file size before compression
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Compress the image
    const compressedFile = await imageCompression(file, options);

    // Check compressed file size
    if (compressedFile.size > MAX_FILE_SIZE) {
      throw new Error(`Compressed file size (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) still exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Convert compressed file to base64 data URL
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read compressed file'));
      };
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to compress image');
  }
}

/**
 * Compress a base64 image data URL
 * @param dataUrl - Base64 data URL string
 * @param options - Compression options (defaults to photo options)
 * @returns Compressed image as base64 data URL
 */
export async function compressBase64Image(
  dataUrl: string,
  options: imageCompression.Options = PHOTO_COMPRESSION_OPTIONS
): Promise<string> {
  try {
    // Convert data URL to File object
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });

    // Compress using the file compression function
    return await compressImage(file, options);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to compress base64 image');
  }
}

/**
 * Get file size from base64 data URL
 * @param dataUrl - Base64 data URL string
 * @returns File size in bytes
 */
export function getBase64FileSize(dataUrl: string): number {
  if (!dataUrl || !dataUrl.includes(',')) {
    return 0;
  }
  const base64Data = dataUrl.split(',')[1];
  // Base64 is approximately 33% larger than binary
  return (base64Data.length * 3) / 4;
}
