import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(newNotification.id);
      }, newNotification.duration);
    }
  }

  success(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 0 // Errors don't auto-dismiss by default
    });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  dismissAll(): void {
    this.notificationsSubject.next([]);
  }

  transactionSuccess(transactionId: string, amount: number, type: string): void {
    this.success(
      `${type} of ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} completed successfully!`,
      'Transaction Completed',
      7000
    );
  }

  transactionError(message: string): void {
    this.error(
      message || 'Transaction failed. Please try again or contact support.',
      'Transaction Failed'
    );
  }

  accountCreated(accountNumber: string): void {
    this.success(
      `Your new account ${accountNumber} has been created successfully!`,
      'Account Created',
      7000
    );
  }

  loginSuccess(userName: string): void {
    this.success(
      `Welcome back, ${userName}!`,
      'Login Successful',
      3000
    );
  }

  sessionExpired(): void {
    this.warning(
      'Your session has expired. Please log in again.',
      'Session Expired',
      0
    );
  }
}
