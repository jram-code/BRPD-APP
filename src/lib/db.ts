import Dexie, { type Table } from 'dexie';
import type { Project, Inspection, CheckItem, Photo, SyncQueueItem } from '@/types';

class BRPDDatabase extends Dexie {
  projects!: Table<Project, string>;
  inspections!: Table<Inspection, string>;
  checkItems!: Table<CheckItem, string>;
  photos!: Table<Photo, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('brpd-inspector');

    this.version(1).stores({
      projects: 'id, updatedAt, synced',
      inspections: 'id, projectId, updatedAt, synced',
      checkItems: 'id, inspectionId, ref, section, status, synced',
      photos: 'id, checkItemId, inspectionId, itemRef, synced',
      syncQueue: '++id, table, recordId, createdAt',
    });
  }
}

export const db = new BRPDDatabase();

// Helper to queue a sync operation
export async function queueSync(
  table: string,
  recordId: string,
  action: 'upsert' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  await db.syncQueue.add({
    table,
    recordId,
    action,
    data,
    createdAt: new Date().toISOString(),
  });
}

// Save project and queue sync
export async function saveProject(project: Project): Promise<void> {
  const updated = { ...project, updatedAt: new Date().toISOString(), synced: false };
  await db.projects.put(updated);
  await queueSync('projects', project.id, 'upsert', updated as unknown as Record<string, unknown>);
}

// Save inspection and queue sync
export async function saveInspection(inspection: Inspection): Promise<void> {
  const updated = { ...inspection, updatedAt: new Date().toISOString(), synced: false };
  await db.inspections.put(updated);
  await queueSync('inspections', inspection.id, 'upsert', updated as unknown as Record<string, unknown>);
}

// Save check item and queue sync
export async function saveCheckItem(item: CheckItem): Promise<void> {
  const updated = { ...item, updatedAt: new Date().toISOString(), synced: false };
  await db.checkItems.put(updated);
  await queueSync('check_items', item.id, 'upsert', updated as unknown as Record<string, unknown>);
}

// Save photo and queue sync
export async function savePhoto(photo: Photo): Promise<void> {
  await db.photos.put({ ...photo, synced: false });
  await queueSync('photos', photo.id, 'upsert', {
    id: photo.id,
    checkItemId: photo.checkItemId,
    inspectionId: photo.inspectionId,
    itemRef: photo.itemRef,
    timestamp: photo.timestamp,
  });
}

// Delete photo
export async function deletePhoto(photoId: string): Promise<void> {
  await db.photos.delete(photoId);
  await queueSync('photos', photoId, 'delete', {});
}

// Get all projects
export async function getProjects(): Promise<Project[]> {
  return db.projects.toArray();
}

// Get inspections for a project
export async function getInspections(projectId: string): Promise<Inspection[]> {
  return db.inspections.where('projectId').equals(projectId).toArray();
}

// Get check items for an inspection
export async function getCheckItems(inspectionId: string): Promise<CheckItem[]> {
  return db.checkItems.where('inspectionId').equals(inspectionId).toArray();
}

// Get photos for an inspection
export async function getPhotos(inspectionId: string): Promise<Photo[]> {
  return db.photos.where('inspectionId').equals(inspectionId).toArray();
}

// Get photos for a specific check item
export async function getPhotosForItem(checkItemId: string): Promise<Photo[]> {
  return db.photos.where('checkItemId').equals(checkItemId).toArray();
}

// Delete project and all related data
export async function deleteProject(projectId: string): Promise<void> {
  const inspections = await getInspections(projectId);
  for (const inspection of inspections) {
    await db.checkItems.where('inspectionId').equals(inspection.id).delete();
    await db.photos.where('inspectionId').equals(inspection.id).delete();
  }
  await db.inspections.where('projectId').equals(projectId).delete();
  await db.projects.delete(projectId);
}
