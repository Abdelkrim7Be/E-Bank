import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CustomerNavigationComponent } from './customer-navigation.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CustomerNavigationComponent],
  templateUrl: "./customer-layout.component.html",
  styleUrl: "./customer-layout.component.css"
})
export class CustomerLayoutComponent {
  constructor() {}
}
