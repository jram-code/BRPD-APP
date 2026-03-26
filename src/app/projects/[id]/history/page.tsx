'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { db, getCheckItems } from '@/lib/db';
import type { Project, Inspection, CheckItem, CheckStatus } from '@/types';

interface VisitSummary {
  inspection: Inspection;
  items: CheckItem[];
  pass: number;
  fail: number;
  na: number;
  outstanding: number;
}

interface StatusChange {
  ref: string;
  text: string;
  from: CheckStatus;
  to: CheckStatus;
}

export default function HistoryPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [, setProject] = useState<Project | null>(null);
  const [visits, setVisits] = useState<VisitSummary[]>([]);
  const [compareVisits, setCompareVisits] = useState<[number, number] | null>(null);
  const [changes, setChanges] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await db.projects.get(projectId);
      if (p) setProject(p);

      const inspections = await db.inspections
        .where('projectId')
        .equals(projectId)
        .toArray();

      const summaries: VisitSummary[] = [];
      for (const insp of inspections.sort((a, b) => a.visitNumber - b.visitNumber)) {
        const items = await getCheckItems(insp.id);
        summaries.push({
          inspection: insp,
          items,
          pass: items.filter((i) => i.status === 'pass').length,
          fail: items.filter((i) => i.status === 'fail').length,
          na: items.filter((i) => i.status === 'na').length,
          outstanding: items.filter((i) => i.status === 'outstanding').length,
        });
      }

      setVisits(summaries);
      setLoading(false);
    }
    load();
  }, [projectId]);

  function compareTwo(fromIdx: number, toIdx: number) {
    const fromVisit = visits[fromIdx];
    const toVisit = visits[toIdx];

    const changeList: StatusChange[] = [];
    for (const toItem of toVisit.items) {
      const fromItem = fromVisit.items.find((fi) => fi.ref === toItem.ref);
      if (fromItem && fromItem.status !== toItem.status) {
        changeList.push({
          ref: toItem.ref,
          text: toItem.text,
          from: fromItem.status,
          to: toItem.status,
        });
      }
    }

    setCompareVisits([fromIdx, toIdx]);
    setChanges(changeList);
  }

  const statusLabel: Record<CheckStatus, string> = {
    outstanding: 'Outstanding',
    pass: 'Pass',
    fail: 'Fail',
    na: 'N/A',
  };

  const statusColor: Record<CheckStatus, string> = {
    outstanding: 'text-gray-500',
    pass: 'text-green-600',
    fail: 'text-red-600',
    na: 'text-gray-400',
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Visit History" backHref={`/projects/${projectId}`} />
        <div className="p-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Visit History"
        backHref={`/projects/${projectId}`}
      />

      <main className="p-4 max-w-2xl mx-auto">
        {/* Visit summaries */}
        <div className="space-y-3 mb-6">
          {visits.map((visit, idx) => {
            const total = visit.items.length;
            const done = total - visit.outstanding;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={visit.inspection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-dark-grey">
                    Visit {visit.inspection.visitNumber}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {visit.inspection.date
                      ? new Date(visit.inspection.date).toLocaleDateString('en-GB')
                      : 'No date'}
                  </span>
                </div>

                <div className="flex gap-3 text-xs mb-2">
                  <span className="text-green-600">Pass: {visit.pass}</span>
                  <span className="text-red-600">Fail: {visit.fail}</span>
                  <span className="text-gray-400">N/A: {visit.na}</span>
                  <span className="text-gray-500">Outstanding: {visit.outstanding}</span>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-orange rounded-full" style={{ width: `${percent}%` }} />
                </div>

                {idx > 0 && (
                  <button
                    onClick={() => compareTwo(idx - 1, idx)}
                    className="text-xs text-navy font-medium underline"
                  >
                    Compare with Visit {visits[idx - 1].inspection.visitNumber}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison results */}
        {compareVisits && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-dark-grey mb-3">
              Changes: Visit {visits[compareVisits[0]].inspection.visitNumber} → Visit{' '}
              {visits[compareVisits[1]].inspection.visitNumber}
            </h3>

            {changes.length === 0 ? (
              <p className="text-sm text-gray-500">No status changes between these visits.</p>
            ) : (
              <div className="space-y-2">
                {changes.map((change) => (
                  <div key={change.ref} className="border-b border-gray-100 pb-2">
                    <span className="text-xs font-mono text-gray-400">{change.ref}</span>
                    <p className="text-sm text-dark-grey">{change.text}</p>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className={statusColor[change.from]}>
                        {statusLabel[change.from]}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={statusColor[change.to]}>
                        {statusLabel[change.to]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setCompareVisits(null);
                setChanges([]);
              }}
              className="mt-3 text-xs text-gray-500 underline"
            >
              Close comparison
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
