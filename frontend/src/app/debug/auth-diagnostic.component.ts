import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auth-diagnostic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./auth-diagnostic.component.html",
  styleUrl: "./auth-diagnostic.component.css"
})
export class AuthDiagnosticComponent implements OnInit {
  tokenExists = false;
  tokenLength = 0;
  tokenPreview = '';
  tokenExpired = false;
  tokenExpiration = '';
  tokenStatus = { message: '', class: '' };

  userExists = false;
  currentUser: any = null;
  isAuthenticated = false;
  isCustomer = false;
  userStatus = { message: '', class: '' };

  apiTests: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.runDiagnostic();
  }

  runDiagnostic(): void {
    console.log('🔍 Running authentication diagnostic...');
    
    this.checkToken();
    
    this.checkUser();
    
    this.testAPIs();
  }

  private checkToken(): void {
    const token = this.authService.getToken();
    this.tokenExists = !!token;
    this.tokenLength = token?.length || 0;
    this.tokenPreview = token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'No token';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expDate = new Date(payload.exp * 1000);
        this.tokenExpiration = expDate.toLocaleString();
        this.tokenExpired = expDate < new Date();
        
        if (this.tokenExpired) {
          this.tokenStatus = {
            message: 'Token is EXPIRED',
            class: 'alert-danger'
          };
        } else {
          this.tokenStatus = {
            message: 'Token is VALID',
            class: 'alert-success'
          };
        }
      } catch (e) {
        this.tokenStatus = {
          message: 'Token is INVALID (decode error)',
          class: 'alert-danger'
        };
      }
    } else {
      this.tokenStatus = {
        message: 'No token found',
        class: 'alert-warning'
      };
    }
  }

  private checkUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userExists = !!this.currentUser;
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isCustomer = this.authService.isCustomer();
    
    if (this.userExists && this.isAuthenticated) {
      this.userStatus = {
        message: 'User is authenticated',
        class: 'alert-success'
      };
    } else {
      this.userStatus = {
        message: 'User is NOT authenticated',
        class: 'alert-danger'
      };
    }
  }

  private testAPIs(): void {
    this.apiTests = [];
    
    this.testAPI('Login Endpoint', `${environment.apiUrl}/auth/login`, 'POST', {
      username: 'test',
      password: 'test'
    }, false);
    
    this.testAPI('Customer Accounts', `${environment.apiUrl}/customer/accounts`, 'GET', null, true);
    
    this.testAPI('Customer Transactions', `${environment.apiUrl}/customer/transactions`, 'GET', null, true);
  }

  private testAPI(name: string, url: string, method: string, body: any = null, needsAuth: boolean = false): void {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (needsAuth) {
      const token = this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const options: any = { headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    fetch(url, {
      method,
      ...options
    })
    .then(response => {
      this.apiTests.push({
        name,
        url,
        status: `${response.status} ${response.statusText}`,
        class: response.ok ? 'alert-success' : 'alert-danger',
        error: response.ok ? null : `HTTP ${response.status}`
      });
    })
    .catch(error => {
      this.apiTests.push({
        name,
        url,
        status: 'FAILED',
        class: 'alert-danger',
        error: error.message
      });
    });
  }

  clearStorage(): void {
    if (confirm('Are you sure you want to clear all authentication data?')) {
      localStorage.removeItem('digital-banking-token');
      localStorage.removeItem('current_user');
      console.log('🗑️ Storage cleared');
      this.runDiagnostic();
    }
  }

  goToLogin(): void {
    window.location.href = '/auth/login';
  }

  testDirectAPI(): void {
    console.log('🧪 Testing direct API call...');
    
    fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'abdelkrim',
        password: 'password123'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Login successful:', data);
      
      return fetch(`${environment.apiUrl}/customer/accounts`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
    })
    .then(response => response.json())
    .then(accounts => {
      console.log('✅ Customer accounts:', accounts);
      alert(`✅ Direct API test successful! Found ${accounts.length} accounts.`);
    })
    .catch(error => {
      console.error('❌ Direct API test failed:', error);
      alert(`❌ Direct API test failed: ${error.message}`);
    });
  }
}
