import { db, getCheckItems, getPhotos, getInspections, saveProject, saveInspection, saveCheckItem, savePhoto } from './db';
import { blobToDataUrl } from './photos';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Inspection, CheckItem, Photo, ProjectConfig } from '@/types';

interface ExportData {
  version: 1;
  exportedAt: string;
  project: Project;
  inspections: Inspection[];
  checkItems: CheckItem[];
  photos?: {
    id: string;
    checkItemId: string;
    inspectionId: string;
    itemRef: string;
    timestamp: string;
    dataUrl: string;
    thumbnailDataUrl: string;
  }[];
}

export async function exportInspectionData(
  projectId: string,
  includePhotos: boolean
): Promise<string> {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('Project not found');

  const inspections = await getInspections(projectId);
  const allCheckItems: CheckItem[] = [];
  const allPhotos: Photo[] = [];

  for (const inspection of inspections) {
    const items = await getCheckItems(inspection.id);
    allCheckItems.push(...items);
    const photos = await getPhotos(inspection.id);
    allPhotos.push(...photos);
  }

  const exportData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    inspections,
    checkItems: allCheckItems,
  };

  if (includePhotos && allPhotos.length > 0) {
    exportData.photos = [];
    for (const photo of allPhotos) {
      const dataUrl = await blobToDataUrl(photo.blob);
      const thumbnailDataUrl = await blobToDataUrl(photo.thumbnailBlob);
      exportData.photos.push({
        id: photo.id,
        checkItemId: photo.checkItemId,
        inspectionId: photo.inspectionId,
        itemRef: photo.itemRef,
        timestamp: photo.timestamp,
        dataUrl,
        thumbnailDataUrl,
      });
    }
  }

  return JSON.stringify(exportData, null, 2);
}

export async function importInspectionData(jsonString: string): Promise<string> {
  const data: ExportData = JSON.parse(jsonString);

  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  // Generate new IDs to avoid conflicts
  const projectIdMap = new Map<string, string>();
  const inspectionIdMap = new Map<string, string>();
  const checkItemIdMap = new Map<string, string>();

  // Import project
  const newProjectId = uuidv4();
  projectIdMap.set(data.project.id, newProjectId);

  const project: Project = {
    ...data.project,
    id: newProjectId,
    synced: false,
  };
  await saveProject(project);

  // Import inspections
  for (const insp of data.inspections) {
    const newInspId = uuidv4();
    inspectionIdMap.set(insp.id, newInspId);

    const inspection: Inspection = {
      ...insp,
      id: newInspId,
      projectId: newProjectId,
      synced: false,
    };
    await saveInspection(inspection);
  }

  // Import check items
  for (const item of data.checkItems) {
    const newItemId = uuidv4();
    checkItemIdMap.set(item.id, newItemId);

    const checkItem: CheckItem = {
      ...item,
      id: newItemId,
      inspectionId: inspectionIdMap.get(item.inspectionId) || item.inspectionId,
      synced: false,
    };
    await saveCheckItem(checkItem);
  }

  // Import photos
  if (data.photos) {
    for (const photoData of data.photos) {
      const blob = await dataUrlToBlob(photoData.dataUrl);
      const thumbnailBlob = await dataUrlToBlob(photoData.thumbnailDataUrl);

      const photo: Photo = {
        id: uuidv4(),
        checkItemId: checkItemIdMap.get(photoData.checkItemId) || photoData.checkItemId,
        inspectionId: inspectionIdMap.get(photoData.inspectionId) || photoData.inspectionId,
        itemRef: photoData.itemRef,
        blob,
        thumbnailBlob,
        storagePath: '',
        timestamp: photoData.timestamp,
        synced: false,
      };
      await savePhoto(photo);
    }
  }

  return newProjectId;
}

export function exportProjectConfig(config: ProjectConfig): string {
  return JSON.stringify(config, null, 2);
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
