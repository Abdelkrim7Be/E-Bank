import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-admin-reports', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html', styleUrl: './reports.component.css'
})
export class AdminReportsComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly reports = [
    { id: 'customer-summary', title: 'Customer summary', description: 'Customers, accounts and transaction counts.' },
    { id: 'account-balance', title: 'Account balances', description: 'Balances and distribution by account type.' },
    { id: 'transaction-analysis', title: 'Transaction analysis', description: 'Activity and volumes over a selected period.' },
  ];
  selected = 'customer-summary';
  days = 30;
  loading = false;
  error = '';
  result: Record<string, unknown> | null = null;
  generatedTitle = '';
  generatedId = '';

  generate(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.result = null;
    const report = this.reports.find(r => r.id === this.selected)!;
    this.http.get<Record<string, unknown>>(`${environment.apiUrl}/reports/${report.id}`, {
      params: report.id === 'transaction-analysis' ? { days: String(this.days) } : {}
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)).subscribe({
      next: result => { this.result = result; this.generatedTitle = report.title; this.generatedId = report.id; },
      error: () => this.error = 'The report could not be generated. Please try again.'
    });
  }

  get entries(): [string, unknown][] {
    return Object.entries(this.result ?? {});
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
  }

  formatValue(value: unknown): string {
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? 'Not available');
  }

  isObjectArray(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
  }

  isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  isSimpleList(value: unknown): boolean {
    return Array.isArray(value) && !this.isObjectArray(value);
  }

  tableColumns(rows: Record<string, unknown>[]): string[] {
    return Object.keys(rows[0]).filter(key => key !== 'id');
  }

  isMoneyField(key: string): boolean {
    return /balance|amount|volume/i.test(key);
  }

  formatCell(key: string, value: unknown): string {
    if (typeof value === 'number') {
      return this.isMoneyField(key)
        ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : value.toLocaleString('en-US');
    }
    return String(value ?? '—');
  }

  objectEntries(value: Record<string, unknown>): [string, unknown][] {
    return Object.entries(value);
  }

  formatList(value: unknown[]): string {
    return value.map(item => String(item)).join(', ');
  }

  download(): void {
    if (!this.result) return;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 18;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;
    const footer = () => {
      pdf.setDrawColor(225, 226, 231);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(98, 99, 107);
      pdf.text('E-Bank · Confidential', margin, pageHeight - 9);
      pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin - 15, pageHeight - 9);
    };
    const header = () => {
      pdf.setFillColor(31, 54, 139); pdf.rect(0, 0, pageWidth, 10, 'F');
      pdf.setFillColor(255, 204, 0); pdf.rect(margin, 0, 3, 10, 'F');
      pdf.setTextColor(31, 54, 139); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('E-BANK', margin, 25);
      pdf.setFontSize(15); pdf.text(this.generatedTitle, margin, 34);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(98, 99, 107);
      pdf.text(`Prepared ${new Date().toLocaleString('fr-FR')}`, margin, 41);
      y = 52;
    };
    const newPage = () => { footer(); pdf.addPage(); header(); };
    const ensure = (height: number) => { if (y + height > pageHeight - 22) newPage(); };
    header();

    const numericEntries = this.entries.filter(([, value]) => typeof value === 'number').slice(0, 4);
    if (numericEntries.length) {
      const gap = 4; const width = (pageWidth - margin * 2 - gap * (numericEntries.length - 1)) / numericEntries.length;
      numericEntries.forEach(([key, value], index) => {
        const x = margin + index * (width + gap);
        pdf.setFillColor(247, 249, 252); pdf.roundedRect(x, y, width, 22, 3, 3, 'F');
        pdf.setTextColor(98, 99, 107); pdf.setFontSize(8); pdf.text(this.formatLabel(key).toUpperCase(), x + 4, y + 7);
        pdf.setTextColor(31, 54, 139); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text(this.formatValue(value), x + 4, y + 16);
        pdf.setFont('helvetica', 'normal');
      });
      y += 32;
    }

    const sectionTitle = (label: string) => {
      ensure(16);
      pdf.setFillColor(31, 54, 139); pdf.rect(margin, y - 4, 2, 11, 'F');
      pdf.setTextColor(31, 54, 139); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(label, margin + 6, y + 3);
      y += 10;
    };

    const drawObjectTable = (rows: Record<string, unknown>[]) => {
      const columns = this.tableColumns(rows);
      const tableX = margin + 6, tableWidth = pageWidth - margin * 2 - 6;
      const colWidth = tableWidth / columns.length;
      const rowHeight = 7;
      const drawHeader = () => {
        pdf.setFillColor(247, 249, 252); pdf.rect(tableX, y - 5, tableWidth, rowHeight, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(98, 99, 107);
        columns.forEach((col, i) => pdf.text(this.formatLabel(col).toUpperCase(), tableX + i * colWidth + 2, y - 1));
        y += rowHeight;
      };
      drawHeader();
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(48, 49, 58);
      rows.forEach((row, index) => {
        if (y + rowHeight > pageHeight - 22) { newPage(); sectionTitle(this.generatedTitle + ' (continued)'); drawHeader(); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(48, 49, 58); }
        if (index % 2 === 1) { pdf.setFillColor(250, 251, 253); pdf.rect(tableX, y - 5, tableWidth, rowHeight, 'F'); }
        columns.forEach((col, i) => {
          const text = this.formatCell(col, row[col]);
          const truncated = pdf.splitTextToSize(text, colWidth - 4)[0];
          pdf.text(truncated, tableX + i * colWidth + 2, y - 1);
        });
        y += rowHeight;
      });
      y += 6;
    };

    const drawKeyValueTable = (pairs: [string, unknown][]) => {
      const tableX = margin + 6, tableWidth = pageWidth - margin * 2 - 6;
      const rowHeight = 7;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
      pairs.forEach((pair, index) => {
        ensure(rowHeight);
        if (index % 2 === 1) { pdf.setFillColor(250, 251, 253); pdf.rect(tableX, y - 5, tableWidth, rowHeight, 'F'); }
        pdf.setTextColor(98, 99, 107); pdf.text(this.formatLabel(pair[0]), tableX + 2, y - 1);
        pdf.setTextColor(48, 49, 58); pdf.text(this.formatCell(pair[0], pair[1]), tableX + tableWidth * 0.45, y - 1);
        y += rowHeight;
      });
      y += 6;
    };

    for (const [key, value] of this.entries) {
      if (typeof value === 'number') continue;
      if (['reportType', 'generatedDate', 'projectionStatus', 'projectionUpdatedAt'].includes(key)) continue;
      sectionTitle(this.formatLabel(key));
      if (this.isObjectArray(value)) {
        drawObjectTable(value);
      } else if (this.isPlainObject(value)) {
        drawKeyValueTable(this.objectEntries(value));
      } else {
        const valueText = Array.isArray(value) ? this.formatList(value) : this.formatCell(key, value);
        const lines = pdf.splitTextToSize(valueText, pageWidth - margin * 2 - 8);
        pdf.setTextColor(48, 49, 58); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        for (const line of lines) { ensure(6); pdf.text(line, margin + 6, y); y += 4.5; }
        y += 6;
      }
    }
    footer();
    pdf.save(`e-bank-${this.generatedId}.pdf`);
  }
}
