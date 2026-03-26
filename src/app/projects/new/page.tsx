'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { saveProject } from '@/lib/db';
import type { Project, ProjectConfig, TemplateSection, TemplateItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
  file: File;
  id: string;
}

interface GeneratedChecklist {
  sections: TemplateSection[];
  commissioningItems: TemplateItem[];
  statutoryDeclarations: TemplateItem[];
  generalObservations: TemplateItem[];
  projectSummary?: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'generating' | 'review'>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projectBrief, setProjectBrief] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState<GeneratedChecklist | null>(null);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);

  // Load saved API key on mount
  useEffect(() => {
    const saved = localStorage.getItem('anthropic_api_key');
    if (saved) {
      setApiKey(saved);
      setApiKeySaved(true);
    }
  }, []);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = e.target.files;
    if (!newFiles) return;

    const added: UploadedFile[] = Array.from(newFiles).map((file) => ({
      file,
      id: uuidv4(),
    }));

    setFiles((prev) => [...prev, ...added]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function saveApiKey() {
    localStorage.setItem('anthropic_api_key', apiKey);
    setApiKeySaved(true);
  }

  async function handleGenerate() {
    if (!apiKey) {
      setError('Please enter your Anthropic API key');
      return;
    }
    if (files.length === 0 && !projectBrief.trim()) {
      setError('Please upload documents or describe the project');
      return;
    }

    setError('');
    setGenerating(true);
    setStep('generating');
    setProgress('Uploading documents...');

    try {
      const formData = new FormData();
      formData.append('apiKey', apiKey);
      formData.append('projectBrief', projectBrief);

      for (const { file } of files) {
        formData.append('files', file);
      }

      setProgress('Analysing documents and generating checklist...');

      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate checklist');
      }

      setChecklist(data.checklist);
      setUsage(data.usage);
      setStep('review');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setStep('upload');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAcceptChecklist() {
    if (!checklist) return;

    const id = uuidv4();
    const config: ProjectConfig = {
      metadata: {
        name: '',
        address: '',
        reference: '',
        description: checklist.projectSummary || '',
        bcBody: '',
        bcContact: '',
        company: 'Isles Safety Ltd',
        inspector: '',
      },
      sections: checklist.sections,
      commissioningItems: checklist.commissioningItems || [],
      statutoryDeclarations: checklist.statutoryDeclarations || [],
      generalObservations: checklist.generalObservations || [],
    };

    const project: Project = {
      id,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveProject(project);
    router.push(`/projects/${id}/edit`);
  }

  function getFileIcon(type: string) {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('spreadsheet') || type.includes('excel') || type === 'text/csv') return '📊';
    if (type.includes('word')) return '📝';
    return '📎';
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const totalItems = checklist
    ? checklist.sections.reduce((sum, s) => sum + s.items.length, 0) +
      (checklist.commissioningItems?.length || 0) +
      (checklist.statutoryDeclarations?.length || 0) +
      (checklist.generalObservations?.length || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Generate Checklist"
        backHref="/"
      />

      <main className="p-4 max-w-2xl mx-auto">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* API Key */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-dark-grey mb-2">Anthropic API Key</h3>
              <p className="text-xs text-gray-500 mb-3">
                Your key is stored locally in your browser and sent directly to Anthropic. Never stored on our servers.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeySaved(false);
                  }}
                  placeholder="sk-ant-..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange"
                />
                <button
                  onClick={saveApiKey}
                  className={`tap-target px-3 py-2 rounded-lg text-sm font-medium ${
                    apiKeySaved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-navy text-white'
                  }`}
                >
                  {apiKeySaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>

            {/* Project Brief */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-dark-grey mb-2">Project Description</h3>
              <p className="text-xs text-gray-500 mb-3">
                Describe the project — type of building, scope of works, key systems. This helps generate a more accurate checklist.
              </p>
              <textarea
                value={projectBrief}
                onChange={(e) => setProjectBrief(e.target.value)}
                placeholder="e.g. Category A refurbishment of 3rd floor office space in a 1970s concrete frame building. Works include new partitions, M&E fit-out, fire alarm upgrade to L1, new accessible WC, LED lighting throughout..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-dark-grey mb-2">Upload Documents</h3>
              <p className="text-xs text-gray-500 mb-3">
                Upload drawings (PDF/images), scope of works, existing BC trackers, or any project documents. The AI will analyse them to create a tailored checklist.
              </p>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 mb-3">
                  {files.map(({ file, id }) => (
                    <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-grey truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(id)}
                        className="tap-target text-red-400 text-sm px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload buttons */}
              <div className="flex gap-2">
                <label className="tap-target flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-lg text-sm cursor-pointer font-medium">
                  📄 Add PDFs
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileAdd}
                  />
                </label>
                <label className="tap-target flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-lg text-sm cursor-pointer font-medium">
                  🖼️ Add Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileAdd}
                  />
                </label>
                <label className="tap-target flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-lg text-sm cursor-pointer font-medium">
                  📊 Tracker/Docs
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.docx,.doc,.txt"
                    multiple
                    className="hidden"
                    onChange={handleFileAdd}
                  />
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="tap-target w-full bg-orange text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50"
            >
              Generate Site-Specific Checklist
            </button>

            <p className="text-xs text-gray-400 text-center">
              Uses Claude AI to analyse your documents. Typical cost: 1-5p per generation.
            </p>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">⚙️</div>
            <h2 className="text-lg font-semibold text-dark-grey mb-2">Generating Checklist</h2>
            <p className="text-sm text-gray-500 mb-4">{progress}</p>
            <p className="text-xs text-gray-400">
              This typically takes 15-30 seconds depending on document size.
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && checklist && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-dark-grey mb-2">Generated Checklist</h3>
              {checklist.projectSummary && (
                <p className="text-sm text-gray-600 mb-3">{checklist.projectSummary}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-navy/10 text-navy px-2 py-1 rounded">
                  {checklist.sections.length} sections
                </span>
                <span className="bg-orange/10 text-orange px-2 py-1 rounded">
                  {totalItems} items
                </span>
                {usage && (
                  <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    ~{((usage.inputTokens * 0.000003 + usage.outputTokens * 0.000015) * 100).toFixed(1)}p cost
                  </span>
                )}
              </div>
            </div>

            {/* Section preview */}
            <div className="space-y-2">
              {checklist.sections.map((section) => (
                <details key={section.key} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <summary className="p-3 cursor-pointer font-medium text-sm text-dark-grey flex items-center justify-between">
                    <span>{section.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{section.items.length} items</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1">
                    {section.items.map((item) => (
                      <div key={item.ref} className="text-xs text-gray-600 py-1 border-t border-gray-50">
                        <span className="font-mono text-gray-400">{item.ref}</span>{' '}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </details>
              ))}

              {checklist.commissioningItems?.length > 0 && (
                <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <summary className="p-3 cursor-pointer font-medium text-sm text-dark-grey flex items-center justify-between">
                    <span>Commissioning</span>
                    <span className="text-xs text-gray-400 ml-2">{checklist.commissioningItems.length} items</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1">
                    {checklist.commissioningItems.map((item) => (
                      <div key={item.ref} className="text-xs text-gray-600 py-1 border-t border-gray-50">
                        <span className="font-mono text-gray-400">{item.ref}</span>{' '}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {checklist.statutoryDeclarations?.length > 0 && (
                <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <summary className="p-3 cursor-pointer font-medium text-sm text-dark-grey flex items-center justify-between">
                    <span>Statutory Declarations</span>
                    <span className="text-xs text-gray-400 ml-2">{checklist.statutoryDeclarations.length} items</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1">
                    {checklist.statutoryDeclarations.map((item) => (
                      <div key={item.ref} className="text-xs text-gray-600 py-1 border-t border-gray-50">
                        <span className="font-mono text-gray-400">{item.ref}</span>{' '}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {checklist.generalObservations?.length > 0 && (
                <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <summary className="p-3 cursor-pointer font-medium text-sm text-dark-grey flex items-center justify-between">
                    <span>General Observations</span>
                    <span className="text-xs text-gray-400 ml-2">{checklist.generalObservations.length} items</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1">
                    {checklist.generalObservations.map((item) => (
                      <div key={item.ref} className="text-xs text-gray-600 py-1 border-t border-gray-50">
                        <span className="font-mono text-gray-400">{item.ref}</span>{' '}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('upload');
                  setChecklist(null);
                }}
                className="tap-target flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
              >
                Re-generate
              </button>
              <button
                onClick={handleAcceptChecklist}
                className="tap-target flex-2 flex-grow-[2] bg-orange text-white py-3 rounded-lg font-semibold"
              >
                Use This Checklist
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
