'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { db, saveProject } from '@/lib/db';
import type { Project, ProjectMetadata } from '@/types';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    name: '',
    address: '',
    reference: '',
    description: '',
    bcBody: '',
    bcContact: '',
    company: 'Isles Safety Ltd',
    inspector: '',
  });

  useEffect(() => {
    async function load() {
      const p = await db.projects.get(projectId);
      if (p) {
        setProject(p);
        setMetadata(p.config.metadata);
      }
    }
    load();
  }, [projectId]);

  async function handleSave() {
    if (!project) return;
    const updated: Project = {
      ...project,
      config: { ...project.config, metadata },
    };
    await saveProject(updated);
    router.push(`/projects/${projectId}`);
  }

  function updateField(field: keyof ProjectMetadata, value: string) {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." backHref="/" />
        <div className="p-4 text-center text-gray-500">Loading project...</div>
      </div>
    );
  }

  const fields: { key: keyof ProjectMetadata; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Project Name', placeholder: 'e.g. 10 Mortimer Street' },
    { key: 'address', label: 'Site Address', placeholder: 'Full site address' },
    { key: 'reference', label: 'Reference Number', placeholder: 'e.g. ISL-2026-001' },
    { key: 'description', label: 'Description', placeholder: 'e.g. Category A Refurbishment' },
    { key: 'bcBody', label: 'Building Control Body', placeholder: 'e.g. City of London BC' },
    { key: 'bcContact', label: 'BC Contact', placeholder: 'Name and contact details' },
    { key: 'company', label: 'Company', placeholder: 'Isles Safety Ltd' },
    { key: 'inspector', label: 'Inspector Name', placeholder: 'Your name / qualifications' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Project Setup"
        backHref={`/projects/${projectId}`}
        actions={
          <button
            onClick={handleSave}
            className="tap-target bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Save
          </button>
        }
      />

      <main className="p-4 max-w-2xl mx-auto">
        <div className="space-y-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-dark-grey mb-1">{label}</label>
              <input
                type="text"
                value={metadata[key]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-navy mb-2">Template Items</h3>
          <p className="text-sm text-gray-600">
            This project has{' '}
            {project.config.sections.reduce((sum, s) => sum + s.items.length, 0)} checklist items
            across {project.config.sections.length} sections, plus{' '}
            {project.config.commissioningItems.length} commissioning items,{' '}
            {project.config.statutoryDeclarations.length} declarations, and{' '}
            {project.config.generalObservations.length} general observation items.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            You can customise items after creating your first inspection visit.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full tap-target bg-orange text-white py-3 rounded-lg font-medium text-lg"
        >
          Save Project Details
        </button>
      </main>
    </div>
  );
}
