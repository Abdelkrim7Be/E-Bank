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

    for (const [key, value] of this.entries) {
      if (typeof value === 'number') continue;
      const label = this.formatLabel(key);
      const valueText = Array.isArray(value) ? value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(' · ') : this.formatValue(value);
      const lines = pdf.splitTextToSize(valueText, pageWidth - margin * 2 - 8);
      ensure(16 + lines.length * 4.5);
      pdf.setFillColor(31, 54, 139); pdf.rect(margin, y - 4, 2, 11, 'F');
      pdf.setTextColor(31, 54, 139); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(label, margin + 6, y + 3);
      y += 10; pdf.setTextColor(48, 49, 58); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
      for (const line of lines) { ensure(6); pdf.text(line, margin + 6, y); y += 4.5; }
      y += 6;
    }
    footer();
    pdf.save(`e-bank-${this.generatedId}.pdf`);
  }
}
