import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../auth/services/auth.service";
import { User, UserRole } from "../../../auth/models/auth.model";

@Component({
  selector: "app-navigation",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navigation.component.html",
  styleUrl: "./navigation.component.css",
})
export class NavigationComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showMobileMenu = false;
  showUserDropdown = false;
  showTransactionsDropdown = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  get isCustomer(): boolean {
    return this.currentUser?.role === UserRole.CUSTOMER;
  }

  get displayName(): string {
    if (!this.currentUser) return "";
    const name = [this.currentUser.firstName, this.currentUser.lastName]
      .filter((v) => !!v && v.trim().length > 0)
      .join(" ");
    return name || this.currentUser.username;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    this.showUserDropdown = !this.showUserDropdown;
    this.showTransactionsDropdown = false;
  }

  toggleTransactionsDropdown(event: Event): void {
    event.preventDefault();
    this.showTransactionsDropdown = !this.showTransactionsDropdown;
    this.showUserDropdown = false;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
  }
}
