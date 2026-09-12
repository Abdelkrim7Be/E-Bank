import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth/services/auth.service';
import { ActivityFeedService } from './core/services/activity-feed.service';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { AlertComponent } from './shared/components/alert/alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavigationComponent,
    LoaderComponent,
    NotificationsComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  title = 'E-Bank';
  showNavigation = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activityFeed: ActivityFeedService,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavigationVisibility(event.url);
      });

    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.updateNavigationVisibility(this.router.url);
    });

    this.updateNavigationVisibility(this.router.url);
  }

  private updateNavigationVisibility(url: string): void {
    const isAuthenticated = this.authService.isAuthenticated();
    const isAuthPage = url.startsWith('/auth');
    const isErrorPage =
      url.startsWith('/unauthorized') || url.startsWith('/not-found');

    this.showNavigation = isAuthenticated && !isAuthPage && !isErrorPage;
  }
}
