# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages/LoginPage.e2e.test.ts >> Login >> Lighthouse audits >> tenant dashboard
- Location: src/pages/LoginPage.e2e.test.ts:92:5

# Error details

```
TypeError: Failed to fetch browser webSocket URL from http://127.0.0.1:9222/json/version: fetch failed
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - heading "WebApp" [level=1] [ref=e6]
    - navigation [ref=e7]:
      - link "Dashboard" [ref=e8] [cursor=pointer]:
        - /url: "#/tenant"
      - link "Contracts" [ref=e9] [cursor=pointer]:
        - /url: "#/tenant/contracts"
      - link "Payments" [ref=e10] [cursor=pointer]:
        - /url: "#/tenant/payments"
    - generic [ref=e11]:
      - generic [ref=e12]: jan.kowalski@test.local
      - button "Wyloguj" [ref=e13] [cursor=pointer]
  - main [ref=e14]:
    - generic [ref=e16]:
      - heading "Panel Najemcy" [level=1] [ref=e17]
      - paragraph [ref=e18]: Witaj w panelu najemcy. Tutaj zobaczysz swoje umowy, płatności i nieruchomości.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import lighthouse from 'lighthouse';
  3   | import { writeFileSync, mkdirSync } from 'node:fs';
  4   | import { resolve } from 'node:path';
  5   | 
  6   | // ═══════════════════════════════════════════════════════════
  7   | // E2E: Login Flow
  8   | // ═══════════════════════════════════════════════════════════
  9   | // Self-contained — registers a fresh user before login tests.
  10  | // ═══════════════════════════════════════════════════════════
  11  | 
  12  | const testEmail = `login-e2e-${Date.now()}@example.com`;
  13  | const testPassword = 'StrongPass1!';
  14  | 
  15  | test.describe('Login', () => {
  16  |   test.beforeAll(async ({ browser }) => {
  17  |     // Register a fresh user via the signup page
  18  |     const page = await browser.newPage();
  19  |     await page.goto('/#/signup');
  20  |     await page.getByLabel('Email').fill(testEmail);
  21  |     await page.getByLabel('Hasło').fill(testPassword);
  22  |     await page.getByLabel('Imię').fill('Login');
  23  |     await page.getByLabel('Nazwisko').fill('Tester');
  24  |     await page.getByRole('button', { name: 'Zarejestruj' }).click();
  25  |     // Wait for redirect away from signup
  26  |     await expect(page).not.toHaveURL(/\/#\/signup/, { timeout: 15000 });
  27  |     await page.close();
  28  |   });
  29  | 
  30  |   test('displays the login form', async ({ page }) => {
  31  |     await page.goto('/#/login');
  32  | 
  33  |     await expect(page.getByText('Zaloguj się')).toBeVisible();
  34  |     await expect(page.getByLabel('Email')).toBeVisible();
  35  |     await expect(page.getByLabel('Hasło')).toBeVisible();
  36  |     await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
  37  |   });
  38  | 
  39  |   test('shows error for invalid credentials', async ({ page }) => {
  40  |     await page.goto('/#/login');
  41  | 
  42  |     await page.getByLabel('Email').fill('wrong@example.com');
  43  |     await page.getByLabel('Hasło').fill('wrongpassword');
  44  |     await page.getByRole('button', { name: 'Zaloguj' }).click();
  45  | 
  46  |     // Should display an error message from Supabase
  47  |     await expect(page.getByText(/invalid/i).first()).toBeVisible({ timeout: 10000 });
  48  |   });
  49  | 
  50  |   test('redirects authenticated user to their dashboard', async ({ page }) => {
  51  |     await page.goto('/#/login');
  52  | 
  53  |     await page.getByLabel('Email').fill(testEmail);
  54  |     await page.getByLabel('Hasło').fill(testPassword);
  55  |     await page.getByRole('button', { name: 'Zaloguj' }).click();
  56  | 
  57  |     // After successful login, should be redirected to a role-based dashboard
  58  |     await expect(page).not.toHaveURL(/\/#\/login/, { timeout: 10000 });
  59  |   });
  60  | 
  61  |   test('has a link to the signup page', async ({ page }) => {
  62  |     await page.goto('/#/login');
  63  | 
  64  |     const signupLink = page.getByText('Zarejestruj się');
  65  |     await expect(signupLink).toBeVisible();
  66  |     await expect(signupLink).toHaveAttribute('href', '/signup');
  67  |   });
  68  | 
  69  |   test.describe('Lighthouse audits', () => {
  70  |     test.describe.configure({ mode: 'serial' });
  71  | 
  72  |     const lighthouseAudit = async (page: import('@playwright/test').Page, email: string, password: string, reportName: string): Promise<void> => {
  73  |       const reportsDir = resolve(import.meta.dirname, '..', '.lighthouseci');
  74  |       mkdirSync(reportsDir, { recursive: true });
  75  | 
  76  |       await page.goto('/#/login');
  77  |       await page.getByLabel('Email').fill(email);
  78  |       await page.getByLabel('Hasło').fill(password);
  79  |       await page.getByRole('button', { name: 'Zaloguj' }).click();
  80  |       await expect(page).not.toHaveURL(/\/#\/login/, { timeout: 10000 });
  81  | 
> 82  |       const result = await lighthouse(page.url(), {
      |                      ^ TypeError: Failed to fetch browser webSocket URL from http://127.0.0.1:9222/json/version: fetch failed
  83  |         port: 9222,
  84  |         output: 'html',
  85  |         logLevel: 'warn',
  86  |         onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  87  |       });
  88  | 
  89  |       writeFileSync(resolve(reportsDir, reportName), String(result.report));
  90  |     };
  91  | 
  92  |     test('tenant dashboard', async ({ page }) => {
  93  |       await lighthouseAudit(page, 'jan.kowalski@test.local', 'password123', 'tenant-dashboard.html');
  94  |     });
  95  | 
  96  |     test('admin dashboard', async ({ page }) => {
  97  |       await lighthouseAudit(page, 'admin@test.local', 'password123', 'admin-dashboard.html');
  98  |     });
  99  | 
  100 |     test('landlord dashboard', async ({ page }) => {
  101 |       await lighthouseAudit(page, 'landlord@test.local', 'password123', 'landlord-dashboard.html');
  102 |     });
  103 |   });
  104 | });
  105 | 
```