import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inline-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./inline-alert.component.html",
  styleUrl: "./inline-alert.component.css"
})
export class InlineAlertComponent {
  @Input() type: 'success' | 'error' | 'warning' | 'info' | 'danger' = 'info';
  @Input() title?: string;
  @Input() message: string = '';
  @Input() dismissible: boolean = true;
  @Input() showIcon: boolean = true;
  @Output() dismissed = new EventEmitter<void>();

  getAlertClass(): string {
    switch (this.type) {
      case 'success':
        return 'alert-success';
      case 'error':
      case 'danger':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'success':
        return 'bi bi-check-circle-fill';
      case 'error':
      case 'danger':
        return 'bi bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi bi-exclamation-circle-fill';
      case 'info':
        return 'bi bi-info-circle-fill';
      default:
        return 'bi bi-info-circle-fill';
    }
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
