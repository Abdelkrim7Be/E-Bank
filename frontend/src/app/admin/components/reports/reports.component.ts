import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

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
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—');
  }

  download(): void {
    if (!this.result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(this.result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `e-bank-${this.generatedId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
