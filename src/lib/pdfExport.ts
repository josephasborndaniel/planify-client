import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LineItem } from './supabase';

interface QuotePDFInput {
  quoteType: 'package' | 'custom_stage' | 'catering';
  eventType: string;
  guestCount?: number;
  lineItems: LineItem[];
  subtotal: number;
  gst: number;
  total: number;
  dimensions?: { length: number; width: number };
  vendorName?: string;
  quoteId?: string;
}

export function generateQuotePDF(input: QuotePDFInput): void {
  const doc = new jsPDF();

  // ── Header ────────────────────────────────────────────────────
  doc.setFillColor(42, 125, 212);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Planify', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Event Management & Design', 14, 23);
  doc.text(`Quote ID: ${input.quoteId ?? 'DRAFT'}`, 14, 30);

  // ── Quote Meta ────────────────────────────────────────────────
  doc.setTextColor(13, 45, 82);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const typeLabel = {
    package: 'Package Quote',
    custom_stage: 'Custom Stage Quote',
    catering: 'Catering Quote',
  }[input.quoteType];
  doc.text(typeLabel, 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Event Type: ${input.eventType}`, 14, 56);
  if (input.guestCount) doc.text(`Guest Count: ${input.guestCount}`, 14, 62);
  if (input.dimensions) {
    doc.text(
      `Stage Dimensions: ${input.dimensions.length}m × ${input.dimensions.width}m (${input.dimensions.length * input.dimensions.width} sq.m)`,
      14, input.guestCount ? 68 : 62
    );
  }
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 150, 56);

  // ── Line Items Table ──────────────────────────────────────────
  const startY = input.dimensions || input.guestCount ? 76 : 66;

  autoTable(doc, {
    startY,
    head: [['Item', 'Type', 'Qty', 'Unit Price (₹)', 'Amount (₹)']],
    body: input.lineItems.map(item => [
      item.name,
      item.cost_type === 'fixed_rate' ? 'Fixed' : 'Per Unit',
      item.cost_type === 'fixed_rate' ? '1' : item.quantity.toString(),
      `₹${item.unit_price.toLocaleString('en-IN')}`,
      `₹${item.amount.toLocaleString('en-IN')}`,
    ]),
    headStyles: {
      fillColor: [42, 125, 212],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [13, 45, 82] },
    alternateRowStyles: { fillColor: [240, 247, 255] },
    styles: { cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 22 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 38, halign: 'right' },
    },
  });

  // ── Totals ────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  const drawTotal = (label: string, amount: number, y: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 10);
    doc.setTextColor(bold ? 13 : 80, bold ? 45 : 80, bold ? 82 : 80);
    doc.text(label, 130, y);
    doc.text(`₹${amount.toLocaleString('en-IN')}`, 196, y, { align: 'right' });
  };

  drawTotal('Subtotal', input.subtotal, finalY);
  drawTotal('GST (18%)', input.gst, finalY + 7);

  doc.setDrawColor(42, 125, 212);
  doc.setLineWidth(0.4);
  doc.line(130, finalY + 10, 196, finalY + 10);
  drawTotal('TOTAL', input.total, finalY + 17, true);

  // ── Footer ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated quotation. GST @ 18% applicable.', 105, 285, { align: 'center' });
  doc.text('Planify Event Management • www.planify.app', 105, 290, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────
  const filename = `Planify_${input.quoteType}_Quote_${Date.now()}.pdf`;
  doc.save(filename);
}
