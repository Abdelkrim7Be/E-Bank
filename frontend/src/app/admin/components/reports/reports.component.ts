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
    let y = 20;
    pdf.setFillColor(31, 54, 139);
    pdf.rect(0, 0, pageWidth, 12, 'F');
    pdf.setTextColor(31, 54, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('E-Bank', margin, y + 8);
    pdf.setFontSize(14);
    pdf.text(this.generatedTitle, margin, y + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(98, 99, 107);
    pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y + 27);
    y += 40;

    for (const [key, value] of this.entries) {
      const label = this.formatLabel(key);
      const lines = pdf.splitTextToSize(this.formatValue(value), pageWidth - margin * 2 - 4);
      if (y > 275) { pdf.addPage(); y = 20; }
      pdf.setTextColor(31, 54, 139);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(label, margin, y);
      y += 6;
      pdf.setTextColor(48, 49, 58);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      for (const line of lines) {
        if (y > 285) { pdf.addPage(); y = 20; }
        pdf.text(line, margin + 2, y);
        y += 4.5;
      }
      y += 4;
    }
    pdf.save(`e-bank-${this.generatedId}.pdf`);
  }
}
