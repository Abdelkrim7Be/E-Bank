import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';

async function login(page: Page, role: 'Admin' | 'Customer') {
  await page.goto('/auth/login');
  await page.getByRole('button', { name: role, exact: false }).click();
  await expect(page).toHaveURL(role === 'Admin' ? /admin\/dashboard/ : /customer\/dashboard/);
}
async function headers(page: Page) {
  const token = await page.evaluate(() => sessionStorage.getItem('digital-banking-token') || localStorage.getItem('digital-banking-token'));
  return { Authorization: `Bearer ${token}` };
}

for (const role of ['Admin', 'Customer'] as const) {
  test(`${role} navigation links, logo, keyboard and responsive accessibility`, async ({ page }) => {
    await login(page, role);
    const nav = page.getByRole('navigation', { name: 'Main navigation', includeHidden: true });
    const toggle = page.getByRole('button', { name: 'Toggle navigation' });
    const mobile = (page.viewportSize()?.width || 0) < 768;
    if (mobile) {
      await expect(nav).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await nav.getByRole('link').first().focus();
      await page.keyboard.press('Escape');
      await expect(toggle).toBeFocused();
      await expect(nav).toBeHidden();
      await toggle.click();
    }
    const links = await nav.getByRole('link').evaluateAll(nodes => nodes.map(n => ({ text: n.textContent!, href: n.getAttribute('href')! })));
    for (const link of links) {
      if (mobile && !(await nav.isVisible())) await toggle.click();
      await nav.getByRole('link', { name: link.text, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(link.href + '$'));
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      if (mobile) await expect(nav).toBeHidden();
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (width < 768 && !(await nav.isVisible())) await toggle.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.locator('.bank-brand img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const results = await new AxeBuilder({ page }).include('app-navigation').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
    await page.getByRole('link', { name: 'My profile', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await page.getByRole('link', { name: 'E-Bank home' }).click();
    await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}/dashboard$`));
  });
}

test('dashboard active account count matches persisted statuses', async ({ page }) => {
  await login(page, 'Customer');
  const response = await page.request.get('/api/customer/accounts', { headers: await headers(page) });
  expect(response.ok()).toBe(true);
  const active = (await response.json()).filter((a: any) => a.status === 'ACTIVATED').length;
  await expect(page.locator('.stat-item').filter({ hasText: 'Active Accounts' })).toContainText(String(active));
  const chart = page.locator('#spendingChart');
  await expect(chart).toBeVisible();
  await expect.poll(async () => chart.evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data.some(value => value > 0))).toBe(true);
  expect((await chart.boundingBox())!.height).toBeLessThanOrEqual(300);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await chart.boundingBox())!.height).toBeLessThanOrEqual(300);
});

test('admin creates a customer who can log in with the chosen password', async ({ page }) => {
  await login(page, 'Admin');
  await page.goto('/admin/customers/new');
  const username = 'e2e.' + randomUUID().slice(0, 8);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(username + '@example.test');
  await page.getByLabel('First Name').fill('Test');
  await page.getByLabel('Last Name').fill('Customer');
  await page.getByLabel('Display Name').fill('Test Customer');
  await page.getByLabel('Password').fill('E2eChosenPassword42');
  const created = page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/customers'));
  await page.getByRole('button', { name: 'Create Customer', exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).not.toHaveProperty('password');
  await expect(page).toHaveURL(/\/admin\/customers$/);
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('E2eChosenPassword42');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
  const history = await page.request.get('/api/transactions/customer/history', { headers: await headers(page) });
  expect(history.status()).toBe(200);
  expect((await history.json()).content).toEqual([]);
  await page.goto('/customer/accounts');
  await expect(page.locator('main')).toContainText(/no accounts/i);
});

test('withdrawal persists and invalid money commands leave balances unchanged', async ({ page }) => {
  await login(page, 'Customer');
  const auth = await headers(page);
  const response = await page.request.get('/api/customer/accounts', { headers: auth });
  expect(response.ok()).toBe(true);
  const [account] = (await response.json()).filter((a: any) => a.status === 'ACTIVATED');
  await page.goto('/customer/debit');
  await page.getByLabel('Select Account').selectOption(account.id);
  await page.getByLabel('Amount', { exact: true }).fill('0.13');
  await page.getByLabel('Description').fill('E2E withdrawal');
  const mutation = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/debit'));
  await page.locator('button[type="submit"]').click();
  expect((await mutation).ok()).toBe(true);
  const after = await (await page.request.get(`/api/accounts/${account.id}`, { headers: auth })).json();
  expect(Math.round((after.balance - account.balance) * 100)).toBe(-13);
  for (const amount of [0, -1, 0.001, 999999999]) {
    const invalid = await page.request.post('/api/transactions/debit', {
      headers: { ...auth, 'Idempotency-Key': randomUUID() }, data: { accountId: account.id, amount, description: 'Invalid E2E debit' },
    });
    expect(invalid.status()).toBeGreaterThanOrEqual(400);
    expect(invalid.status()).toBeLessThan(500);
  }
  const sameAccount = await page.request.post('/api/transactions/transfer', {
    headers: { ...auth, 'Idempotency-Key': randomUUID() },
    data: { sourceAccountId: account.id, destinationAccountId: account.id, amount: 1 },
  });
  expect(sameAccount.status()).toBe(400);
  const unchanged = await (await page.request.get(`/api/accounts/${account.id}`, { headers: auth })).json();
  expect(unchanged.balance).toBe(after.balance);
});

test('API rejects unauthenticated, admin-only and other-customer access', async ({ page }) => {
  const unauthenticated = await page.request.get('/api/accounts');
  expect(unauthenticated.status()).toBe(401);
  await login(page, 'Customer');
  const auth = await headers(page);
  for (const path of ['/api/customers', '/api/reports/dashboard', '/api/accounts/ACC-CA-001', '/api/transactions/account/ACC-CA-001']) {
    const denied = await page.request.get(path, { headers: auth });
    expect(denied.status(), path).toBe(403);
  }
  const denied = await page.request.post('/api/transactions/debit', {
    headers: { ...auth, 'Idempotency-Key': randomUUID() }, data: { accountId: 'ACC-CA-001', amount: 1, description: 'Unauthorized' },
  });
  expect(denied.status()).toBe(403);
});

test('remember me controls persistent authentication storage', async ({ page, context }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByLabel('Remember me').check();
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  expect(await context.storageState()).toMatchObject({ cookies: expect.any(Array) });
  expect(await page.evaluate(() => localStorage.getItem('digital-banking-token'))).toBeTruthy();
  expect(await page.evaluate(() => sessionStorage.getItem('digital-banking-token'))).toBeNull();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByLabel('Remember me').uncheck();
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  expect(await page.evaluate(() => sessionStorage.getItem('digital-banking-token'))).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('digital-banking-token'))).toBeNull();
});

test('transfer description is retained in account history', async ({ page }) => {
  await login(page, 'Customer');
  const auth = await headers(page);
  const [source, destination] = await (await page.request.get('/api/customer/accounts', { headers: auth })).json();
  const description = 'E2E rent ' + randomUUID().slice(0, 8);
  const response = await page.request.post('/api/transactions/transfer', {
    headers: { ...auth, 'Idempotency-Key': randomUUID() },
    data: { sourceAccountId: source.id, destinationAccountId: destination.id, amount: 0.01, description },
  });
  expect(response.ok()).toBe(true);
  const history = await page.request.get(`/api/transactions/account/${source.id}/history?size=10`, { headers: auth });
  expect(history.ok()).toBe(true);
  expect((await history.json()).content.some((row: any) => row.description.includes(description))).toBe(true);
});

test('simultaneous first submissions debit only once', async ({ page }) => {
  await login(page, 'Customer');
  const auth = await headers(page);
  const [account] = await (await page.request.get('/api/customer/accounts', { headers: auth })).json();
  const key = randomUUID();
  const requests = await Promise.all(Array.from({ length: 8 }, () => page.request.post('/api/transactions/debit', {
    headers: { ...auth, 'Idempotency-Key': key }, data: { accountId: account.id, amount: 0.07, description: 'Concurrent ' + key },
  })));
  const receipt = await requests[0].json();
  for (const response of requests) {
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(receipt);
  }
  const after = await (await page.request.get(`/api/accounts/${account.id}`, { headers: auth })).json();
  expect(Math.round((after.balance - account.balance) * 100)).toBe(-7);
  const history = await (await page.request.get(`/api/transactions/account/${account.id}/history?size=100`, { headers: auth })).json();
  expect(history.content.filter((row: any) => row.description === 'Concurrent ' + key)).toHaveLength(1);
});

test('customer status and bulk deletion converge in Kafka reports', async ({ page }) => {
  await login(page, 'Admin');
  const auth = await headers(page);
  const stats = async () => {
    const response = await page.request.get('/api/reports/dashboard', { headers: auth });
    expect(response.ok()).toBe(true);
    return response.json();
  };
  // Wait for prior test-created customers to reach the projection first.
  const all = await (await page.request.get('/api/customers', { headers: auth })).json();
  await expect.poll(async () => (await stats()).totalCustomers, { timeout: 30000 }).toBe(all.length);
  const before = await stats();
  const username = 'kafka.' + randomUUID().slice(0, 8);
  const created = await page.request.post('/api/customers', {
    headers: auth, data: { username, name: 'Kafka Lifecycle', email: username + '@example.test', password: 'ChosenPassword42' },
  });
  expect(created.status()).toBe(201);
  const customer = await created.json();
  await expect.poll(async () => (await stats()).activeCustomers, { timeout: 30000 }).toBe(before.activeCustomers + 1);
  const suspended = await page.request.patch(`/api/customers/${customer.id}/status`, { headers: auth, data: { enabled: false } });
  expect(suspended.ok()).toBe(true);
  await expect.poll(async () => (await stats()).activeCustomers, { timeout: 30000 }).toBe(before.activeCustomers);
  const denied = await page.request.post('/api/auth/login', { data: { username, password: 'ChosenPassword42' } });
  expect(denied.status()).toBe(401);
  const deleted = await page.request.delete('/api/customers/bulk', { headers: auth, data: { customerIds: [customer.id] } });
  expect(deleted.status()).toBe(204);
  await expect.poll(async () => (await stats()).totalCustomers, { timeout: 30000 }).toBe(before.totalCustomers);
});

test('dashboard shows an account failure and recovers without fabricated balances', async ({ page }) => {
  await login(page, 'Customer');
  await page.route('**/api/customer/accounts', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Test outage"}' }));
  await page.goto('/customer/dashboard');
  await expect(page.getByRole('alert').filter({ hasText: 'Your accounts could not be loaded' })).toBeVisible();
  await expect(page.locator('.account-card')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('$5,420.50');
  await expect(page.locator('main')).not.toContainText('Total Balance');
  await page.unroute('**/api/customer/accounts');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('main')).toContainText('Total Balance');
  await expect(page.getByRole('alert').filter({ hasText: 'Your accounts could not be loaded' })).toHaveCount(0);
});
