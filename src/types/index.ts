export type CheckStatus = 'outstanding' | 'pass' | 'fail' | 'na';

export interface TemplateItem {
  ref: string;
  text: string;
  section: string;
}

export interface TemplateSection {
  title: string;
  key: string;
  items: TemplateItem[];
}

export interface ProjectConfig {
  metadata: ProjectMetadata;
  sections: TemplateSection[];
  commissioningItems: TemplateItem[];
  statutoryDeclarations: TemplateItem[];
  generalObservations: TemplateItem[];
}

export interface ProjectMetadata {
  name: string;
  address: string;
  reference: string;
  description: string;
  bcBody: string;
  bcContact: string;
  company: string;
  inspector: string;
}

export interface Project {
  id: string;
  config: ProjectConfig;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Inspection {
  id: string;
  projectId: string;
  visitNumber: number;
  date: string;
  inspectorName: string;
  siteContact: string;
  weather: string;
  notes: string;
  nextVisitDate: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface CheckItem {
  id: string;
  inspectionId: string;
  ref: string;
  section: string;
  text: string;
  status: CheckStatus;
  notes: string;
  priority: boolean;
  updatedAt: string;
  synced: boolean;
}

export interface Photo {
  id: string;
  checkItemId: string;
  inspectionId: string;
  itemRef: string;
  blob: Blob;
  thumbnailBlob: Blob;
  storagePath: string;
  timestamp: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  recordId: string;
  action: 'upsert' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
}

export type FilterMode = 'all' | 'outstanding' | 'non-compliant' | 'has-photos' | 'flagged';
