'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { db, saveInspection, saveCheckItem } from '@/lib/db';
import type { Project, Inspection, CheckItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadData() {
    const p = await db.projects.get(projectId);
    if (p) setProject(p);

    const insp = await db.inspections
      .where('projectId')
      .equals(projectId)
      .toArray();
    setInspections(insp.sort((a, b) => b.visitNumber - a.visitNumber));
    setLoading(false);
  }

  async function handleNewVisit() {
    if (!project) return;

    const visitNumber = inspections.length + 1;
    const inspectionId = uuidv4();
    const now = new Date().toISOString();

    const inspection: Inspection = {
      id: inspectionId,
      projectId,
      visitNumber,
      date: now.split('T')[0],
      inspectorName: project.config.metadata.inspector,
      siteContact: '',
      weather: '',
      notes: '',
      nextVisitDate: '',
      createdAt: now,
      updatedAt: now,
      synced: false,
    };

    await saveInspection(inspection);

    // If there's a previous visit, carry forward statuses
    let previousItems: CheckItem[] = [];
    if (inspections.length > 0) {
      const lastInspection = inspections[0]; // sorted descending
      previousItems = await db.checkItems
        .where('inspectionId')
        .equals(lastInspection.id)
        .toArray();
    }

    // Create check items from template
    const allTemplateItems = [
      ...project.config.sections.flatMap((s) => s.items),
      ...project.config.commissioningItems,
      ...project.config.statutoryDeclarations,
      ...project.config.generalObservations,
    ];

    for (const tmpl of allTemplateItems) {
      const prev = previousItems.find((pi) => pi.ref === tmpl.ref);
      const item: CheckItem = {
        id: uuidv4(),
        inspectionId,
        ref: tmpl.ref,
        section: tmpl.section,
        text: tmpl.text,
        status: prev ? prev.status : 'outstanding',
        notes: prev ? prev.notes : '',
        priority: prev ? prev.priority : false,
        updatedAt: now,
        synced: false,
      };
      await saveCheckItem(item);
    }

    router.push(`/projects/${projectId}/inspect/${inspectionId}`);
  }

  function handleExportConfig() {
    if (!project) return;
    const json = JSON.stringify(project.config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.config.metadata.name || 'project').replace(/\s+/g, '-').toLowerCase()}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." backHref="/" />
        <div className="p-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const meta = project.config.metadata;

  return (
    <div className="min-h-screen">
      <Header
        title={meta.name || 'Untitled Project'}
        backHref="/"
        actions={
          <button
            onClick={() => router.push(`/projects/${projectId}/edit`)}
            className="tap-target text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        }
      />

      <main className="p-4 max-w-2xl mx-auto">
        {/* Project info card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <p className="text-sm text-gray-500">{meta.address}</p>
          {meta.reference && (
            <p className="text-xs text-gray-400 mt-1">Ref: {meta.reference}</p>
          )}
          {meta.description && (
            <p className="text-xs text-gray-400">{meta.description}</p>
          )}
          {meta.bcBody && (
            <p className="text-xs text-gray-400 mt-2">
              BC: {meta.bcBody}
              {meta.bcContact && ` (${meta.bcContact})`}
            </p>
          )}
          <p className="text-xs text-gray-400">Inspector: {meta.inspector || 'Not set'}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleNewVisit}
            className="flex-1 tap-target bg-orange text-white py-3 rounded-lg font-medium"
          >
            + New Visit
          </button>
          <button
            onClick={handleExportConfig}
            className="tap-target bg-white text-navy border border-navy py-3 px-4 rounded-lg text-sm font-medium"
          >
            Export Config
          </button>
        </div>

        {/* Inspections list */}
        <h2 className="text-lg font-semibold text-dark-grey mb-3">
          Visits ({inspections.length})
        </h2>

        {inspections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No visits yet. Tap &quot;New Visit&quot; to start your first inspection.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inspections.map((insp) => (
              <button
                key={insp.id}
                onClick={() => router.push(`/projects/${projectId}/inspect/${insp.id}`)}
                className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-orange transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-dark-grey">
                      Visit {insp.visitNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {insp.date
                        ? new Date(insp.date).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'No date set'}
                    </p>
                    {insp.weather && (
                      <p className="text-xs text-gray-400 mt-1">Weather: {insp.weather}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* History link */}
        {inspections.length > 1 && (
          <button
            onClick={() => router.push(`/projects/${projectId}/history`)}
            className="mt-4 w-full tap-target text-center text-sm text-navy font-medium underline py-2"
          >
            View Visit History & Comparison
          </button>
        )}
      </main>
    </div>
  );
}
