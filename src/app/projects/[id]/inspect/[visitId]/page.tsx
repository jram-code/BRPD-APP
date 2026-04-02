'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { FilterBar } from '@/components/FilterBar';
import { CheckItemRow } from '@/components/CheckItemRow';
import { db, saveInspection, getCheckItems, getPhotos } from '@/lib/db';
import type { Project, Inspection, CheckItem, FilterMode, Photo } from '@/types';

interface SectionGroup {
  key: string;
  title: string;
  items: CheckItem[];
}

export default function InspectionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const visitId = params.visitId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<CheckItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showMetadata, setShowMetadata] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await db.projects.get(projectId);
    if (p) setProject(p);

    const insp = await db.inspections.get(visitId);
    if (insp) setInspection(insp);

    const checkItems = await getCheckItems(visitId);
    setItems(checkItems);

    const allPhotos = await getPhotos(visitId);
    setPhotos(allPhotos);

    setLoading(false);
  }, [projectId, visitId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleItemUpdate(updated: CheckItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function getDisplayTitle() {
    if (inspection?.title) return inspection.title;
    return `Visit ${inspection?.visitNumber || ''}`;
  }

  function startEditingTitle() {
    setTitleDraft(getDisplayTitle());
    setEditingTitle(true);
  }

  async function saveTitle() {
    if (!inspection) return;
    const updated = { ...inspection, title: titleDraft.trim() || undefined, updatedAt: new Date().toISOString() };
    setInspection(updated);
    await saveInspection(updated);
    setEditingTitle(false);
  }

  async function handleMetadataChange(field: keyof Inspection, value: string) {
    if (!inspection) return;
    const updated = { ...inspection, [field]: value, updatedAt: new Date().toISOString() };
    setInspection(updated);
    await saveInspection(updated);
  }

  async function handleProjectChange(field: string, value: string) {
    if (!project) return;
    const updated = {
      ...project,
      config: {
        ...project.config,
        metadata: { ...project.config.metadata, [field]: value },
      },
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    await db.projects.put(updated);
  }

  function toggleSection(key: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Build section groups from project config
  function getSectionGroups(): SectionGroup[] {
    if (!project) return [];

    const groups: SectionGroup[] = [];

    // Main sections
    for (const section of project.config.sections) {
      const sectionItems = items.filter((i) => i.section === section.key);
      if (sectionItems.length > 0) {
        groups.push({ key: section.key, title: section.title, items: sectionItems });
      }
    }

    // Commissioning
    const commItems = items.filter((i) => i.section === 'commissioning');
    if (commItems.length > 0) {
      groups.push({ key: 'commissioning', title: 'Commissioning Certificates — Status', items: commItems });
    }

    // Declarations
    const declItems = items.filter((i) => i.section === 'declarations');
    if (declItems.length > 0) {
      groups.push({ key: 'declarations', title: 'Statutory Declarations', items: declItems });
    }

    // General
    const genItems = items.filter((i) => i.section === 'general');
    if (genItems.length > 0) {
      groups.push({ key: 'general', title: 'General Site Observations', items: genItems });
    }

    return groups;
  }

  // Apply filters
  function getFilteredItems(sectionItems: CheckItem[]): CheckItem[] {
    let filtered = sectionItems;

    switch (filter) {
      case 'outstanding':
        filtered = filtered.filter((i) => i.status === 'outstanding');
        break;
      case 'non-compliant':
        filtered = filtered.filter((i) => i.status === 'fail');
        break;
      case 'has-photos':
        filtered = filtered.filter((i) => photos.some((p) => p.checkItemId === i.id));
        break;
      case 'flagged':
        filtered = filtered.filter((i) => i.priority);
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.text.toLowerCase().includes(q) ||
          i.ref.toLowerCase().includes(q) ||
          i.notes.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  function getSectionProgress(sectionItems: CheckItem[]) {
    const total = sectionItems.length;
    const done = sectionItems.filter((i) => i.status !== 'outstanding').length;
    const fail = sectionItems.filter((i) => i.status === 'fail').length;
    return { total, done, fail };
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." backHref={`/projects/${projectId}`} />
        <div className="p-4 text-center text-gray-500">Loading inspection...</div>
      </div>
    );
  }

  const sections = getSectionGroups();

  return (
    <div className="min-h-screen pb-20">
      <Header
        title=""
        backHref={`/projects/${projectId}`}
        actions={
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  autoFocus
                  className="flex-1 min-w-0 px-2 py-1 rounded text-sm text-dark-grey bg-white"
                  placeholder="Visit name..."
                />
                <button onClick={saveTitle} className="tap-target text-white text-sm px-2 py-1 bg-green-500 rounded">
                  Save
                </button>
                <button onClick={() => setEditingTitle(false)} className="tap-target text-white/70 text-sm px-2">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={startEditingTitle}
                  className="text-white font-semibold text-sm truncate hover:underline flex items-center gap-1"
                  title="Tap to rename"
                >
                  {getDisplayTitle()} ✏️
                </button>
                <div className="flex gap-2 ml-auto flex-shrink-0">
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="tap-target text-white/80 hover:text-white text-sm"
                  >
                    ℹ️
                  </button>
                  <button
                    onClick={() => router.push(`/projects/${projectId}/inspect/${visitId}/report`)}
                    className="tap-target bg-orange text-white px-3 py-1.5 rounded text-sm font-medium"
                  >
                    PDF
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Metadata panel */}
      {showMetadata && inspection && project && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 space-y-4">
          {/* Project Details */}
          <div>
            <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Project Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Project Name</label>
                <input
                  type="text"
                  value={project.config.metadata.name}
                  onChange={(e) => handleProjectChange('name', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="Project name"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Address</label>
                <input
                  type="text"
                  value={project.config.metadata.address}
                  onChange={(e) => handleProjectChange('address', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="Site address"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Reference</label>
                <input
                  type="text"
                  value={project.config.metadata.reference}
                  onChange={(e) => handleProjectChange('reference', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="Project reference"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Company</label>
                <input
                  type="text"
                  value={project.config.metadata.company}
                  onChange={(e) => handleProjectChange('company', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="e.g. Isles Safety Ltd"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Building Control Body</label>
                <input
                  type="text"
                  value={project.config.metadata.bcBody}
                  onChange={(e) => handleProjectChange('bcBody', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="e.g. City of Westminster"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">BC Contact</label>
                <input
                  type="text"
                  value={project.config.metadata.bcContact}
                  onChange={(e) => handleProjectChange('bcContact', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="BC surveyor name"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Principal Designer / Inspector</label>
                <input
                  type="text"
                  value={project.config.metadata.inspector}
                  onChange={(e) => handleProjectChange('inspector', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="e.g. Javid Ram"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Description</label>
                <textarea
                  value={project.config.metadata.description}
                  onChange={(e) => handleProjectChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 border rounded text-sm resize-none"
                  placeholder="Brief description of works..."
                />
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div>
            <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Visit Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Visit Title</label>
                <input
                  type="text"
                  value={inspection.title || `Visit ${inspection.visitNumber}`}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="e.g. 20-22 Mortimer Street"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <input
                  type="date"
                  value={inspection.date}
                  onChange={(e) => handleMetadataChange('date', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Next Visit</label>
                <input
                  type="date"
                  value={inspection.nextVisitDate}
                  onChange={(e) => handleMetadataChange('nextVisitDate', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Inspector</label>
                <input
                  type="text"
                  value={inspection.inspectorName}
                  onChange={(e) => handleMetadataChange('inspectorName', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Site Contact</label>
                <input
                  type="text"
                  value={inspection.siteContact}
                  onChange={(e) => handleMetadataChange('siteContact', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Weather</label>
                <input
                  type="text"
                  value={inspection.weather}
                  onChange={(e) => handleMetadataChange('weather', e.target.value)}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="e.g. Overcast, dry"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">General Notes</label>
            <textarea
              value={inspection.notes}
              onChange={(e) => handleMetadataChange('notes', e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 border rounded text-sm resize-none"
              placeholder="General observations for this visit..."
            />
          </div>
        </div>
      )}

      <ProgressBar
        items={items}
        onFilterNonCompliant={() => setFilter('non-compliant')}
      />

      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Sections */}
      <div>
        {sections.map((section) => {
          const filtered = getFilteredItems(section.items);
          const progress = getSectionProgress(section.items);

          if (filter !== 'all' && filtered.length === 0) return null;

          return (
            <div key={section.key}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full text-left bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-[190px] z-20"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-navy truncate">{section.title}</h3>
                  <p className="text-xs text-gray-500">
                    {progress.done}/{progress.total} complete
                    {progress.fail > 0 && (
                      <span className="text-red-500 ml-2">({progress.fail} failed)</span>
                    )}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transform transition-transform flex-shrink-0 ${
                    collapsedSections.has(section.key) ? '' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Section items */}
              {!collapsedSections.has(section.key) && (
                <div>
                  {filtered.map((item) => (
                    <CheckItemRow
                      key={item.id}
                      item={item}
                      onUpdate={handleItemUpdate}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No items match current filter
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
