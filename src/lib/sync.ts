import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Project, Inspection, CheckItem } from '@/types';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

let syncInProgress = false;
let tablesVerified = false;

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : false;
}

async function verifyTablesExist(): Promise<boolean> {
  if (tablesVerified) return true;
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    if (error && (error.code === '42P01' || error.message?.includes('404') || error.code === 'PGRST204')) {
      return false;
    }
    if (!error) {
      tablesVerified = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function syncAll(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isOnline() || syncInProgress) {
    return { success: false, error: 'Not available' };
  }

  syncInProgress = true;

  try {
    // Verify Supabase tables exist before attempting sync
    const tablesReady = await verifyTablesExist();
    if (!tablesReady) {
      return { success: false, error: 'Supabase tables not set up yet' };
    }

    // Process sync queue - push local changes to Supabase
    const queue = await db.syncQueue.toArray();
    let failures = 0;

    for (const item of queue) {
      try {
        if (item.action === 'delete') {
          await handleDelete(item.table, item.recordId);
        } else {
          await handleUpsert(item.table, item.recordId, item.data);
        }
        // Remove from queue on success
        if (item.id) {
          await db.syncQueue.delete(item.id);
        }
      } catch {
        failures++;
      }
    }

    if (failures > 0) {
      console.warn(`Sync: ${failures} items failed to sync`);
    }

    // Pull remote changes
    await pullRemoteChanges();

    return { success: true };
  } catch (err) {
    console.error('Sync error:', err);
    return { success: false, error: String(err) };
  } finally {
    syncInProgress = false;
  }
}

async function handleUpsert(table: string, _recordId: string, data: Record<string, unknown>): Promise<void> {
  const supabaseTable = getSupabaseTable(table);
  const mapped = mapToSupabase(table, data);

  const { error } = await supabase.from(supabaseTable).upsert(mapped, { onConflict: 'id' });
  if (error) throw error;

  // Mark local record as synced
  await markSynced(table, data.id as string);
}

async function handleDelete(table: string, recordId: string): Promise<void> {
  const supabaseTable = getSupabaseTable(table);
  const { error } = await supabase.from(supabaseTable).delete().eq('id', recordId);
  if (error) throw error;
}

async function pullRemoteChanges(): Promise<void> {
  // Pull projects
  const { data: remoteProjects } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (remoteProjects) {
    for (const rp of remoteProjects) {
      const local = await db.projects.get(rp.id);
      if (!local || new Date(rp.updated_at) > new Date(local.updatedAt)) {
        await db.projects.put(mapFromSupabaseProject(rp));
      }
    }
  }

  // Pull inspections
  const { data: remoteInspections } = await supabase
    .from('inspections')
    .select('*')
    .order('updated_at', { ascending: false });

  if (remoteInspections) {
    for (const ri of remoteInspections) {
      const local = await db.inspections.get(ri.id);
      if (!local || new Date(ri.updated_at) > new Date(local.updatedAt)) {
        await db.inspections.put(mapFromSupabaseInspection(ri));
      }
    }
  }

  // Pull check items
  const { data: remoteItems } = await supabase
    .from('check_items')
    .select('*')
    .order('updated_at', { ascending: false });

  if (remoteItems) {
    for (const rc of remoteItems) {
      const local = await db.checkItems.get(rc.id);
      if (!local || new Date(rc.updated_at) > new Date(local.updatedAt)) {
        await db.checkItems.put(mapFromSupabaseCheckItem(rc));
      }
    }
  }
}

function getSupabaseTable(localTable: string): string {
  const map: Record<string, string> = {
    projects: 'projects',
    inspections: 'inspections',
    checkItems: 'check_items',
    check_items: 'check_items',
    photos: 'photos',
  };
  return map[localTable] || localTable;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToSupabase(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = { id: data.id };

  switch (table) {
    case 'projects':
      return {
        ...base,
        name: (data.config as any)?.metadata?.name || '',
        address: (data.config as any)?.metadata?.address || '',
        reference_number: (data.config as any)?.metadata?.reference || '',
        description: (data.config as any)?.metadata?.description || '',
        bc_body: (data.config as any)?.metadata?.bcBody || '',
        bc_contact: (data.config as any)?.metadata?.bcContact || '',
        company: (data.config as any)?.metadata?.company || '',
        inspector: (data.config as any)?.metadata?.inspector || '',
        template_config: data.config,
        updated_at: data.updatedAt,
      };
    case 'inspections':
      return {
        ...base,
        project_id: data.projectId,
        visit_number: data.visitNumber,
        date: data.date,
        inspector_name: data.inspectorName,
        site_contact: data.siteContact,
        weather: data.weather,
        notes: data.notes,
        next_visit_date: data.nextVisitDate,
        updated_at: data.updatedAt,
      };
    case 'check_items':
    case 'checkItems':
      return {
        ...base,
        inspection_id: data.inspectionId,
        ref: data.ref,
        section: data.section,
        text: data.text,
        status: data.status,
        notes: data.notes,
        priority: data.priority,
        updated_at: data.updatedAt,
      };
    case 'photos':
      return {
        ...base,
        check_item_id: data.checkItemId,
        inspection_id: data.inspectionId,
        item_ref: data.itemRef,
        storage_path: data.storagePath || '',
        timestamp: data.timestamp,
      };
    default:
      return data;
  }
}

function mapFromSupabaseProject(rp: any): Project {
  return {
    id: rp.id,
    config: rp.template_config || {
      metadata: {
        name: rp.name || '',
        address: rp.address || '',
        reference: rp.reference_number || '',
        description: rp.description || '',
        bcBody: rp.bc_body || '',
        bcContact: rp.bc_contact || '',
        company: rp.company || '',
        inspector: rp.inspector || '',
      },
      sections: [],
      commissioningItems: [],
      statutoryDeclarations: [],
      generalObservations: [],
    },
    createdAt: rp.created_at,
    updatedAt: rp.updated_at,
    synced: true,
  };
}

function mapFromSupabaseInspection(ri: any): Inspection {
  return {
    id: ri.id,
    projectId: ri.project_id,
    visitNumber: ri.visit_number,
    date: ri.date || '',
    inspectorName: ri.inspector_name || '',
    siteContact: ri.site_contact || '',
    weather: ri.weather || '',
    notes: ri.notes || '',
    nextVisitDate: ri.next_visit_date || '',
    createdAt: ri.created_at,
    updatedAt: ri.updated_at,
    synced: true,
  };
}

function mapFromSupabaseCheckItem(rc: any): CheckItem {
  return {
    id: rc.id,
    inspectionId: rc.inspection_id,
    ref: rc.ref,
    section: rc.section,
    text: rc.text,
    status: rc.status || 'outstanding',
    notes: rc.notes || '',
    priority: rc.priority || false,
    updatedAt: rc.updated_at,
    synced: true,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function markSynced(table: string, id: string): Promise<void> {
  switch (table) {
    case 'projects':
      await db.projects.update(id, { synced: true });
      break;
    case 'inspections':
      await db.inspections.update(id, { synced: true });
      break;
    case 'check_items':
    case 'checkItems':
      await db.checkItems.update(id, { synced: true });
      break;
    case 'photos':
      await db.photos.update(id, { synced: true });
      break;
  }
}

// Upload photo to Supabase Storage
export async function uploadPhoto(
  photoId: string,
  blob: Blob,
  path: string
): Promise<string | null> {
  if (!isSupabaseConfigured() || !isOnline()) return null;

  const { error } = await supabase.storage
    .from('inspection-photos')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) {
    console.error('Photo upload failed:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('inspection-photos')
    .getPublicUrl(path);

  // Update local record with storage path
  await db.photos.update(photoId, { storagePath: path, synced: true });

  return urlData.publicUrl;
}

// Auto-sync setup
export function startAutoSync(intervalMs = 30000): () => void {
  const interval = setInterval(() => {
    if (isOnline() && isSupabaseConfigured()) {
      syncAll();
    }
  }, intervalMs);

  // Also sync on coming online
  const handleOnline = () => {
    syncAll();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  return () => {
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
  };
}
