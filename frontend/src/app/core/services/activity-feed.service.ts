import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationService } from './notification.service';

interface ActivityEvent {
  eventId: string;
  accountId: string;
  type: string;
  amount: number;
  occurredAt: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityFeedService {
  private pollSubscription?: Subscription;
  private seenEventIds = new Set<string>();
  private since = new Date().toISOString();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private notifications: NotificationService,
  ) {
    this.auth.currentUser$.subscribe((user) => {
      if (user && user.role === 'CUSTOMER') this.start();
      else this.stop();
    });
  }

  private start(): void {
    if (this.pollSubscription) return;
    this.pollSubscription = interval(15000)
      .pipe(switchMap(() => this.fetch()))
      .subscribe();
  }

  private stop(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
    this.seenEventIds.clear();
    this.since = new Date().toISOString();
  }

  private fetch() {
    const url = `${environment.apiUrl}/reports/activity?since=${encodeURIComponent(this.since)}`;
    return this.http.get<ActivityEvent[]>(url).pipe(
      switchMap(async (events) => {
        for (const event of events.slice().reverse()) {
          if (this.seenEventIds.has(event.eventId)) continue;
          this.seenEventIds.add(event.eventId);
          this.notifications.info(
            `${event.type} of ${event.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} on ${event.accountId}`,
            'New account activity',
            8000,
          );
        }
        this.since = new Date().toISOString();
        return events;
      }),
    );
  }
}
