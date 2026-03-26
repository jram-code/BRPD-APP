'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { db, getCheckItems, getPhotos } from '@/lib/db';
import { generateReport } from '@/lib/pdf-report';
import { exportInspectionData, downloadJson, downloadBlob } from '@/lib/export';
import type { Project, Inspection } from '@/types';

export default function ReportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const visitId = params.visitId as string;

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    const project = await db.projects.get(projectId);
    const inspection = await db.inspections.get(visitId);
    const items = await getCheckItems(visitId);
    const photos = await getPhotos(visitId);
    return { project, inspection, items, photos };
  }, [projectId, visitId]);

  async function handleGeneratePdf() {
    setGenerating(true);
    try {
      const { project, inspection, items, photos } = await loadData();
      if (!project || !inspection) {
        alert('Could not load project data');
        return;
      }

      const doc = await generateReport({
        project: project as Project,
        inspection: inspection as Inspection,
        items,
        photos,
        sections: project.config.sections.map((s) => ({ key: s.key, title: s.title })),
      });

      const name = (project.config.metadata.name || 'inspection')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const blob = doc.output('blob');
      downloadBlob(blob, `${name}-visit-${inspection.visitNumber}-report.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(includePhotos: boolean) {
    setExporting(true);
    try {
      if (includePhotos) {
        const proceed = confirm(
          'Exporting with photos may create a very large file. Continue?'
        );
        if (!proceed) {
          setExporting(false);
          return;
        }
      }

      const json = await exportInspectionData(projectId, includePhotos);
      const { project } = await loadData();
      const name = (project?.config.metadata.name || 'inspection')
        .replace(/\s+/g, '-')
        .toLowerCase();
      downloadJson(
        json,
        `${name}-export${includePhotos ? '-with-photos' : ''}.json`
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Generate Report"
        backHref={`/projects/${projectId}/inspect/${visitId}`}
      />

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* PDF Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-dark-grey mb-2">PDF Report</h2>
          <p className="text-sm text-gray-500 mb-4">
            Generate a branded inspection report with cover page, executive summary,
            full checklist tables, photos, and sign-off block.
          </p>
          <button
            onClick={handleGeneratePdf}
            disabled={generating}
            className="w-full tap-target bg-orange text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {generating ? 'Generating PDF...' : 'Generate PDF Report'}
          </button>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-dark-grey mb-2">Data Export</h2>
          <p className="text-sm text-gray-500 mb-4">
            Export inspection data as JSON for backup or sharing.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleExport(false)}
              disabled={exporting}
              className="w-full tap-target bg-navy text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export Data (No Photos)'}
            </button>
            <button
              onClick={() => handleExport(true)}
              disabled={exporting}
              className="w-full tap-target bg-white text-navy border border-navy py-3 rounded-lg font-medium disabled:opacity-50"
            >
              Export with Photos (Large File)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
