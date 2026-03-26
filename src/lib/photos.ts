import { v4 as uuidv4 } from 'uuid';
import { db, savePhoto, deletePhoto as dbDeletePhoto } from './db';
import { uploadPhoto, isOnline } from './sync';
import { isSupabaseConfigured } from './supabase';
import type { Photo } from '@/types';

const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 200;
const JPEG_QUALITY = 0.7;
const THUMBNAIL_QUALITY = 0.6;

export async function resizeImage(
  file: File | Blob,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function processAndSavePhoto(
  file: File | Blob,
  checkItemId: string,
  inspectionId: string,
  itemRef: string
): Promise<Photo> {
  const [blob, thumbnailBlob] = await Promise.all([
    resizeImage(file, MAX_WIDTH, JPEG_QUALITY),
    resizeImage(file, THUMBNAIL_WIDTH, THUMBNAIL_QUALITY),
  ]);

  const photo: Photo = {
    id: uuidv4(),
    checkItemId,
    inspectionId,
    itemRef,
    blob,
    thumbnailBlob,
    storagePath: '',
    timestamp: new Date().toISOString(),
    synced: false,
  };

  await savePhoto(photo);

  // Try to upload to Supabase if online
  if (isOnline() && isSupabaseConfigured()) {
    const path = `${inspectionId}/${itemRef}/${photo.id}.jpg`;
    await uploadPhoto(photo.id, blob, path);
  }

  return photo;
}

export async function removePhoto(photoId: string): Promise<void> {
  await dbDeletePhoto(photoId);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getPhotoDataUrl(photo: Photo): Promise<string> {
  return blobToDataUrl(photo.blob);
}

export async function getThumbnailDataUrl(photo: Photo): Promise<string> {
  return blobToDataUrl(photo.thumbnailBlob);
}

// Get all photos for a check item
export async function getItemPhotos(checkItemId: string): Promise<Photo[]> {
  return db.photos.where('checkItemId').equals(checkItemId).toArray();
}
