'use client';

import { useState, useEffect, useRef } from 'react';
import type { CheckItem, CheckStatus, Photo } from '@/types';
import { saveCheckItem } from '@/lib/db';
import { processAndSavePhoto, removePhoto, getThumbnailDataUrl } from '@/lib/photos';
import { getItemPhotos } from '@/lib/photos';

interface CheckItemRowProps {
  item: CheckItem;
  onUpdate: (updated: CheckItem) => void;
}


export function CheckItemRow({ item, onUpdate }: CheckItemRowProps) {
  const [notes, setNotes] = useState(item.notes);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function loadPhotos() {
    const p = await getItemPhotos(item.id);
    setPhotos(p);
    const thumbs: Record<string, string> = {};
    for (const photo of p) {
      thumbs[photo.id] = await getThumbnailDataUrl(photo);
    }
    setThumbnails(thumbs);
  }

  async function setStatus(status: CheckStatus) {
    // If tapping the same status, toggle back to outstanding
    const newStatus = item.status === status ? 'outstanding' : status;
    const updated: CheckItem = { ...item, status: newStatus, updatedAt: new Date().toISOString() };
    await saveCheckItem(updated);
    onUpdate(updated);
  }

  async function togglePriority() {
    const updated: CheckItem = { ...item, priority: !item.priority, updatedAt: new Date().toISOString() };
    await saveCheckItem(updated);
    onUpdate(updated);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(async () => {
      const updated: CheckItem = { ...item, notes: value, updatedAt: new Date().toISOString() };
      await saveCheckItem(updated);
      onUpdate(updated);
    }, 500);
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await processAndSavePhoto(file, item.id, item.inspectionId, item.ref);
    }
    await loadPhotos();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeletePhoto(photoId: string) {
    await removePhoto(photoId);
    await loadPhotos();
    setLightboxPhoto(null);
  }

  const statusBg =
    item.status === 'pass'
      ? 'bg-green-50'
      : item.status === 'fail'
      ? 'bg-red-50'
      : item.status === 'na'
      ? 'bg-gray-50'
      : 'bg-white';

  return (
    <>
      <div className={`border-b border-gray-100 ${statusBg} ${item.priority ? 'border-l-4 border-l-orange' : ''}`} id={`item-${item.ref}`}>
        <div className="flex items-start gap-2 p-3">
          {/* Status buttons - Pass / Fail / N/A */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => setStatus('pass')}
              className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg ${
                item.status === 'pass'
                  ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300'
                  : 'bg-green-50 text-green-400 border border-green-200'
              }`}
              aria-label="Pass"
            >
              ✓
            </button>
            <button
              onClick={() => setStatus('fail')}
              className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg ${
                item.status === 'fail'
                  ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300'
                  : 'bg-red-50 text-red-300 border border-red-200'
              }`}
              aria-label="Fail"
            >
              ✗
            </button>
            <button
              onClick={() => setStatus('na')}
              className={`w-11 h-7 rounded flex items-center justify-center font-bold text-xs ${
                item.status === 'na'
                  ? 'bg-gray-500 text-white shadow-md ring-2 ring-gray-300'
                  : 'bg-gray-50 text-gray-400 border border-gray-200'
              }`}
              aria-label="Not Applicable"
            >
              N/A
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="w-full text-left">
              <div className="flex items-start gap-1">
                <span className="text-xs font-mono text-gray-400 flex-shrink-0">{item.ref}</span>
                {item.priority && <span className="text-orange text-xs">⚑</span>}
                {photos.length > 0 && <span className="text-xs text-gray-400">📷{photos.length}</span>}
              </div>
              <p className="text-sm text-dark-grey mt-0.5 leading-snug">{item.text}</p>
            </div>

            {/* Notes - always visible */}
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes / comments..."
              rows={2}
              className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange"
            />

            {/* Always-visible action bar */}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-1 px-3 py-1.5 bg-navy/10 text-navy rounded-lg text-xs font-medium cursor-pointer">
                📷 Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
              <label className="flex items-center gap-1 px-3 py-1.5 bg-navy/10 text-navy rounded-lg text-xs font-medium cursor-pointer">
                🖼️ Gallery
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
              <button
                onClick={togglePriority}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  item.priority
                    ? 'bg-orange text-white'
                    : 'bg-navy/10 text-navy'
                }`}
              >
                {item.priority ? '⚑ Priority' : '⚐ Flag'}
              </button>
            </div>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative flex-shrink-0">
                    <button
                      onClick={() => setLightboxPhoto(photo.id)}
                      className="w-16 h-16 rounded overflow-hidden bg-gray-100"
                    >
                      {thumbnails[photo.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnails[photo.id]}
                          alt={photo.itemRef}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <LightboxModal
          photo={photos.find((p) => p.id === lightboxPhoto)!}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => handleDeletePhoto(lightboxPhoto)}
        />
      )}
    </>
  );
}

function LightboxModal({
  photo,
  onClose,
  onDelete,
}: {
  photo: Photo;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(photo.blob);
    setDataUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex justify-between items-center p-4 text-white">
        <span className="text-sm">
          {photo.itemRef} · {new Date(photo.timestamp).toLocaleString()}
        </span>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="tap-target text-red-400 text-sm"
          >
            Delete
          </button>
          <button onClick={onClose} className="tap-target text-white text-xl">
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4" onClick={onClose}>
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={photo.itemRef}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
