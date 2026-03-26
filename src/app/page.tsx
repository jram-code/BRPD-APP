'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { db, deleteProject, saveProject } from '@/lib/db';
import type { Project, Inspection, ProjectConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { defaultTemplate } from '@/data/default-template';

interface ProjectWithStats extends Project {
  inspectionCount: number;
  lastVisitDate: string;
  progress: number;
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteDoubleConfirm, setDeleteDoubleConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const allProjects = await db.projects.toArray();
    const withStats: ProjectWithStats[] = [];

    for (const project of allProjects) {
      const inspections = await db.inspections
        .where('projectId')
        .equals(project.id)
        .toArray();

      let lastVisitDate = '';
      let progress = 0;

      if (inspections.length > 0) {
        const sorted = inspections.sort(
          (a: Inspection, b: Inspection) =>
            new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        );
        lastVisitDate = sorted[0].date || sorted[0].createdAt;

        const latestItems = await db.checkItems
          .where('inspectionId')
          .equals(sorted[0].id)
          .toArray();

        if (latestItems.length > 0) {
          const completed = latestItems.filter((i) => i.status !== 'outstanding').length;
          progress = Math.round((completed / latestItems.length) * 100);
        }
      }

      withStats.push({
        ...project,
        inspectionCount: inspections.length,
        lastVisitDate,
        progress,
      });
    }

    setProjects(withStats);
    setLoading(false);
  }

  async function handleCreateFromTemplate() {
    const id = uuidv4();
    const project: Project = {
      id,
      config: { ...defaultTemplate },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await saveProject(project);
    router.push(`/projects/${id}/edit`);
  }

  async function handleImportConfig(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config: ProjectConfig = JSON.parse(text);

      if (!config.metadata || !config.sections) {
        alert('Invalid project config file');
        return;
      }

      const id = uuidv4();
      const project: Project = {
        id,
        config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      };
      await saveProject(project);
      router.push(`/projects/${id}`);
    } catch {
      alert('Failed to parse config file');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(projectId: string) {
    if (!deleteDoubleConfirm) {
      setDeleteDoubleConfirm(true);
      return;
    }
    await deleteProject(projectId);
    setDeleteConfirm(null);
    setDeleteDoubleConfirm(false);
    loadProjects();
  }

  return (
    <div className="min-h-screen">
      <Header
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/projects/new')}
              className="tap-target bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Generate
            </button>
            <button
              onClick={handleCreateFromTemplate}
              className="tap-target bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Template
            </button>
          </div>
        }
      />

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h2 className="text-xl font-semibold text-dark-grey mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">
              Create a new project from the default template or import an existing config.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => router.push('/projects/new')}
                className="tap-target bg-orange text-white px-6 py-3 rounded-lg font-medium"
              >
                Generate from Documents
              </button>
              <button
                onClick={handleCreateFromTemplate}
                className="tap-target bg-navy text-white px-6 py-3 rounded-lg font-medium"
              >
                Create from Template
              </button>
              <label className="tap-target bg-gray-200 text-dark-grey px-6 py-3 rounded-lg font-medium cursor-pointer">
                Import Config
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportConfig}
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-grey">
                Projects ({projects.length})
              </h2>
              <label className="tap-target text-sm text-navy font-medium cursor-pointer underline">
                Import
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportConfig}
                />
              </label>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-dark-grey truncate">
                          {project.config.metadata.name || 'Untitled Project'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {project.config.metadata.address || 'No address'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {project.config.metadata.reference && (
                            <span>Ref: {project.config.metadata.reference} · </span>
                          )}
                          {project.inspectionCount} visit
                          {project.inspectionCount !== 1 ? 's' : ''}
                          {project.lastVisitDate && (
                            <span>
                              {' '}
                              · Last:{' '}
                              {new Date(project.lastVisitDate).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="ml-3 text-right flex-shrink-0">
                        <div
                          className={`text-2xl font-bold ${
                            project.progress === 100
                              ? 'text-green-600'
                              : project.progress > 50
                              ? 'text-orange'
                              : 'text-gray-400'
                          }`}
                        >
                          {project.progress}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-orange"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </button>

                  {deleteConfirm === project.id ? (
                    <div className="border-t border-gray-100 p-3 bg-red-50 flex items-center justify-between">
                      <span className="text-sm text-red-700">
                        {deleteDoubleConfirm
                          ? 'Are you absolutely sure?'
                          : 'Delete this project?'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setDeleteConfirm(null);
                            setDeleteDoubleConfirm(false);
                          }}
                          className="tap-target px-3 py-1 text-sm text-gray-600 bg-white rounded border"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="tap-target px-3 py-1 text-sm text-white bg-red-600 rounded"
                        >
                          {deleteDoubleConfirm ? 'Yes, Delete' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 px-4 py-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(project.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
