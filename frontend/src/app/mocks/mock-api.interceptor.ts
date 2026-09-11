import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_DATA } from './mock-data';
import { environment } from '../../environments/environment';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!environment.useMockApi) {
      return next.handle(request);
    }

    if (!request.url.includes('/api/')) {
      return next.handle(request);
    }

    const delay_ms = 500;

    const apiEndpoint = this.getEndpoint(request.url);

    if (MOCK_DATA[apiEndpoint as keyof typeof MOCK_DATA]) {
      console.log(`[MockAPI] Intercepted request to ${apiEndpoint}`);
      return of(
        new HttpResponse({
          status: 200,
          body: this.processRequest(request, apiEndpoint),
        })
      ).pipe(delay(delay_ms));
    }

    if (request.method === 'POST' && apiEndpoint === '/api/auth/login') {
      const body = request.body;

      if (body && body.username === 'admin' && body.password === 'admin123') {
        return of(
          new HttpResponse({
            status: 200,
            body: {
              token: 'mock-jwt-token-admin',
              username: 'admin',
              role: 'ADMIN',
              email: 'admin@digitalbank.com',
              message: 'Login successful',
            },
          })
        ).pipe(delay(delay_ms));
      }

      const customers = environment.testCredentials.customers;
      const customer = customers.find(
        (c) => c.username === body.username && c.password === body.password
      );

      if (customer) {
        return of(
          new HttpResponse({
            status: 200,
            body: {
              token: `mock-jwt-token-${customer.username}`,
              username: customer.username,
              role: 'CUSTOMER',
              email: `${customer.username}@digitalbank.com`,
              message: 'Login successful',
            },
          })
        ).pipe(delay(delay_ms));
      }

      return of(
        new HttpResponse({
          status: 401,
          body: { message: 'Invalid credentials' },
        })
      ).pipe(delay(delay_ms));
    }

    if (request.method === 'GET' && apiEndpoint === '/api/dashboard/stats') {
      return of(
        new HttpResponse({
          status: 200,
          body: {
            totalCustomers: 1247,
            totalAccounts: 2156,
            totalBalance: 15678432.5,
            totalCurrentAccounts: 1356,
            totalSavingAccounts: 800,
            totalOperations: 8934,
          },
        })
      ).pipe(delay(delay_ms));
    }

    if (
      request.method === 'GET' &&
      apiEndpoint === '/api/dashboard/accounts-summary'
    ) {
      return of(
        new HttpResponse({
          status: 200,
          body: {
            totalAccounts: 2156,
            totalCurrentAccounts: 1356,
            totalSavingAccounts: 800,
            totalBalance: 15678432.5,
            averageBalance: 7270.5,
          },
        })
      ).pipe(delay(delay_ms));
    }

    if (
      request.method === 'GET' &&
      apiEndpoint === '/api/dashboard/customers-summary'
    ) {
      return of(
        new HttpResponse({
          status: 200,
          body: {
            totalCustomers: 1247,
            activeCustomers: 1189,
            newCustomersThisMonth: 58,
            customersWithAccounts: 1156,
          },
        })
      ).pipe(delay(delay_ms));
    }

    if (request.method === 'GET' && apiEndpoint === '/api/dashboard/health') {
      return of(
        new HttpResponse({
          status: 200,
          body: {
            status: 'UP',
            database: 'UP',
            diskSpace: 'UP',
            timestamp: new Date(),
          },
        })
      ).pipe(delay(delay_ms));
    }

    if (request.method === 'GET' && apiEndpoint === '/api/customer/dashboard') {
      return of(
        new HttpResponse({
          status: 200,
          body: {
            accounts: {
              totalAccounts: 2,
              accountsByType: {
                SAVINGS: 1,
                CHECKING: 1,
                BUSINESS: 0,
                INVESTMENT: 0,
              },
              totalBalance: 18170.75,
              averageBalance: 9085.38,
            },
            recentTransactions: [
              {
                id: 1,
                type: 'DEPOSIT',
                amount: 1500.0,
                description: 'Salary Deposit',
                createdDate: new Date().toISOString(),
                status: 'COMPLETED',
              },
              {
                id: 2,
                type: 'WITHDRAWAL',
                amount: 250.0,
                description: 'ATM Withdrawal',
                createdDate: new Date(Date.now() - 86400000).toISOString(),
                status: 'COMPLETED',
              },
            ],
          },
        })
      ).pipe(delay(delay_ms));
    }

    console.log(`[MockAPI] No mock data for ${apiEndpoint}, passing through`);
    return next.handle(request);
  }

  private getEndpoint(url: string): string {
    const apiPathMatch = url.match(/\/api\/[^?]*/);
    return apiPathMatch ? apiPathMatch[0] : url;
  }

  private processRequest(request: HttpRequest<any>, endpoint: string): any {
    switch (request.method) {
      case 'GET':
        return MOCK_DATA[endpoint as keyof typeof MOCK_DATA];

      case 'POST':
        return (
          MOCK_DATA[endpoint as keyof typeof MOCK_DATA] || {
            id: new Date().getTime(),
            success: true,
          }
        );

      case 'PUT':
        return {
          ...MOCK_DATA[endpoint as keyof typeof MOCK_DATA],
          ...request.body,
          updated: true,
        };

      case 'DELETE':
        return { success: true };

      default:
        return MOCK_DATA[endpoint as keyof typeof MOCK_DATA];
    }
  }
}
