import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, Inspection, CheckItem, Photo } from '@/types';
import { blobToDataUrl } from './photos';

const NAVY = '#1B3A4F';
const ORANGE = '#D4741C';
const DARK_GREY = '#333333';
const LIGHT_GREEN = '#dcfce7';
const LIGHT_RED = '#fee2e2';
const LIGHT_GREY = '#f3f4f6';

interface ReportData {
  project: Project;
  inspection: Inspection;
  items: CheckItem[];
  photos: Photo[];
  sections: { key: string; title: string }[];
}

export async function generateReport(data: ReportData): Promise<jsPDF> {
  const { project, inspection, items, photos, sections } = data;
  const meta = project.config.metadata;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Helper: add header/footer to every page
  function addHeaderFooter() {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Header
      doc.setFillColor(NAVY);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFontSize(7);
      doc.setTextColor('#ffffff');
      doc.text('Isles Safety Ltd | BRPD Site Inspection Report', margin, 8);

      // Footer
      doc.setFillColor('#f5f5f5');
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      doc.setFontSize(6);
      doc.setTextColor(DARK_GREY);
      doc.text(
        `CONFIDENTIAL — ${meta.address || 'Site Address'}`,
        margin,
        pageHeight - 4
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 4, {
        align: 'right',
      });
    }
  }

  // Stats
  const total = items.length;
  const pass = items.filter((i) => i.status === 'pass').length;
  const fail = items.filter((i) => i.status === 'fail').length;
  const na = items.filter((i) => i.status === 'na').length;
  const outstanding = items.filter((i) => i.status === 'outstanding').length;
  const percent = total > 0 ? Math.round(((total - outstanding) / total) * 100) : 0;

  // ===== COVER PAGE =====
  // Orange accent bar
  doc.setFillColor(ORANGE);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Title block
  doc.setFillColor(NAVY);
  doc.rect(0, 5, pageWidth, 50, 'F');

  doc.setTextColor('#ffffff');
  doc.setFontSize(24);
  doc.text('BRPD Site Inspection Report', margin, 30);
  doc.setFontSize(11);
  doc.text('Isles Safety Ltd', margin, 40);
  doc.setFontSize(9);
  doc.text(`Visit ${inspection.visitNumber}`, margin, 48);

  // Project details
  let y = 70;
  doc.setTextColor(DARK_GREY);
  doc.setFontSize(14);
  doc.text(meta.name || 'Untitled Project', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(meta.address || '', margin, y);
  y += 12;

  const details = [
    ['Reference:', meta.reference || 'N/A'],
    ['Description:', meta.description || 'N/A'],
    ['Building Control:', meta.bcBody || 'N/A'],
    ['BC Contact:', meta.bcContact || 'N/A'],
    ['Inspector:', meta.inspector || 'N/A'],
    ['Inspector (Visit):', inspection.inspectorName || 'N/A'],
    ['Inspection Date:', inspection.date ? new Date(inspection.date).toLocaleDateString('en-GB') : 'N/A'],
    ['Site Contact:', inspection.siteContact || 'N/A'],
    ['Weather:', inspection.weather || 'N/A'],
  ];

  doc.setFontSize(9);
  for (const [label, value] of details) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, y);
    y += 6;
  }

  // ===== EXECUTIVE SUMMARY =====
  doc.addPage();
  y = 20;

  doc.setFontSize(16);
  doc.setTextColor(NAVY);
  doc.text('Executive Summary', margin, y);
  y += 10;

  // Summary table
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Items Inspected', String(total)],
      ['Pass', String(pass)],
      ['Fail', String(fail)],
      ['N/A', String(na)],
      ['Outstanding', String(outstanding)],
      ['Completion', `${percent}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth / 2,
  });

  // Non-compliant items list
  const failedItems = items.filter((i) => i.status === 'fail');
  if (failedItems.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.setTextColor('#dc2626');
    doc.text('Non-Compliant Items', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Ref', 'Item', 'Notes']],
      body: failedItems.map((i) => [i.ref, i.text, i.notes || '']),
      theme: 'grid',
      headStyles: { fillColor: '#dc2626', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: contentWidth * 0.45 },
        2: { cellWidth: contentWidth * 0.35 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // ===== FULL CHECKLIST =====
  // Group items by section using the sections config
  const allSectionKeys = [
    ...sections.map((s) => ({ key: s.key, title: s.title })),
    { key: 'commissioning', title: 'Commissioning Certificates — Status' },
    { key: 'declarations', title: 'Statutory Declarations' },
    { key: 'general', title: 'General Site Observations' },
  ];

  for (const section of allSectionKeys) {
    const sectionItems = items.filter((i) => i.section === section.key);
    if (sectionItems.length === 0) continue;

    doc.addPage();
    y = 20;

    doc.setFontSize(12);
    doc.setTextColor(NAVY);
    doc.text(section.title, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Ref', 'Check Item', 'Status', 'Notes']],
      body: sectionItems.map((i) => [
        i.ref,
        i.text,
        i.status.toUpperCase(),
        i.notes || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: contentWidth * 0.45 },
        2: { cellWidth: 18 },
        3: { cellWidth: contentWidth - 18 - contentWidth * 0.45 - 18 },
      },
      margin: { left: margin, right: margin },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 2) {
          const status = data.cell.raw?.toString().toLowerCase();
          if (status === 'pass') {
            data.cell.styles.fillColor = LIGHT_GREEN;
          } else if (status === 'fail') {
            data.cell.styles.fillColor = LIGHT_RED;
          } else if (status === 'n/a') {
            data.cell.styles.fillColor = LIGHT_GREY;
          }
        }
        // Color whole row lightly
        if (data.section === 'body') {
          const rowItems2 = sectionItems[data.row.index];
          if (rowItems2) {
            if (rowItems2.status === 'pass') {
              data.cell.styles.fillColor = '#f0fdf4';
            } else if (rowItems2.status === 'fail') {
              data.cell.styles.fillColor = '#fef2f2';
            } else if (rowItems2.status === 'na') {
              data.cell.styles.fillColor = '#f9fafb';
            }
          }
        }
      },
    });

    // Embed photos for this section's items
    const sectionPhotos: { photo: Photo; itemRef: string }[] = [];
    for (const item of sectionItems) {
      const itemPhotos = photos.filter((p) => p.checkItemId === item.id);
      for (const photo of itemPhotos) {
        sectionPhotos.push({ photo, itemRef: item.ref });
      }
    }

    if (sectionPhotos.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(9);
      doc.setTextColor(DARK_GREY);
      doc.text('Photos', margin, y);
      y += 4;

      let x = margin;
      const photoWidth = (contentWidth - 5) / 2;
      const photoHeight = 50;

      for (const { photo, itemRef } of sectionPhotos) {
        if (y + photoHeight + 10 > pageHeight - 15) {
          doc.addPage();
          y = 20;
          x = margin;
        }

        try {
          const dataUrl = await blobToDataUrl(photo.blob);
          doc.addImage(dataUrl, 'JPEG', x, y, photoWidth, photoHeight);

          // Caption
          doc.setFontSize(6);
          doc.setTextColor(DARK_GREY);
          doc.text(
            `${itemRef} — ${new Date(photo.timestamp).toLocaleString()}`,
            x,
            y + photoHeight + 3
          );
        } catch {
          // Skip if photo can't be loaded
        }

        if (x === margin) {
          x = margin + photoWidth + 5;
        } else {
          x = margin;
          y += photoHeight + 10;
        }
      }
    }
  }

  // ===== NON-COMPLIANT APPENDIX =====
  if (failedItems.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFontSize(16);
    doc.setTextColor('#dc2626');
    doc.text('Non-Compliant Items — Detailed', margin, y);
    y += 10;

    for (const item of failedItems) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(DARK_GREY);
      doc.text(`${item.ref}: ${item.text}`, margin, y, { maxWidth: contentWidth });
      y += 6;

      if (item.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Notes: ${item.notes}`, margin + 5, y, { maxWidth: contentWidth - 5 });
        const lines = doc.splitTextToSize(`Notes: ${item.notes}`, contentWidth - 5);
        y += lines.length * 4 + 4;
      }

      // Photos for this item
      const itemPhotos = photos.filter((p) => p.checkItemId === item.id);
      if (itemPhotos.length > 0) {
        for (const photo of itemPhotos) {
          if (y + 55 > pageHeight - 15) {
            doc.addPage();
            y = 20;
          }
          try {
            const dataUrl = await blobToDataUrl(photo.blob);
            doc.addImage(dataUrl, 'JPEG', margin + 5, y, 60, 45);
            doc.setFontSize(6);
            doc.text(new Date(photo.timestamp).toLocaleString(), margin + 5, y + 48);
            y += 52;
          } catch {
            // Skip
          }
        }
      }

      y += 5;
    }
  }

  // ===== SIGN-OFF =====
  doc.addPage();
  y = 20;

  doc.setFontSize(16);
  doc.setTextColor(NAVY);
  doc.text('Sign-Off', margin, y);
  y += 15;

  doc.setFontSize(10);
  doc.setTextColor(DARK_GREY);

  const signOffFields = [
    ['Inspector:', inspection.inspectorName || meta.inspector || ''],
    ['Company:', meta.company || 'Isles Safety Ltd'],
    ['Date:', inspection.date ? new Date(inspection.date).toLocaleDateString('en-GB') : ''],
    ['Next Inspection:', inspection.nextVisitDate ? new Date(inspection.nextVisitDate).toLocaleDateString('en-GB') : 'TBC'],
  ];

  for (const [label, value] of signOffFields) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, y);
    y += 8;
  }

  // Key actions
  if (failedItems.length > 0) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Key Actions Required:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const item of failedItems.slice(0, 10)) {
      doc.text(`• ${item.ref}: ${item.text}`, margin + 5, y, { maxWidth: contentWidth - 5 });
      y += 5;
    }
    if (failedItems.length > 10) {
      doc.text(`... and ${failedItems.length - 10} more items`, margin + 5, y);
      y += 5;
    }
  }

  // Signature line
  y += 15;
  doc.setDrawColor(DARK_GREY);
  doc.line(margin, y, margin + 80, y);
  y += 5;
  doc.setFontSize(8);
  doc.text('Signature', margin, y);

  y += 10;
  doc.line(margin, y, margin + 80, y);
  y += 5;
  doc.text('Date', margin, y);

  // Add headers/footers to all pages
  addHeaderFooter();

  return doc;
}
