import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════
// E2E: Login Flow
// ═══════════════════════════════════════════════════════════
// Self-contained — registers a fresh user before login tests.
// ═══════════════════════════════════════════════════════════

const testEmail = `login-e2e-${Date.now()}@example.com`;
const testPassword = 'StrongPass1!';

test.describe('Login', () => {
  test.beforeAll(async ({ browser }) => {
    // Register a fresh user via the signup page
    const page = await browser.newPage();
    await page.goto('/#/signup');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Hasło').fill(testPassword);
    await page.getByLabel('Imię').fill('Login');
    await page.getByLabel('Nazwisko').fill('Tester');
    await page.getByRole('button', { name: 'Zarejestruj' }).click();
    // Wait for redirect away from signup
    await expect(page).not.toHaveURL(/\/#\/signup/, { timeout: 15000 });
    await page.close();
  });

  test('displays the login form', async ({ page }) => {
    await page.goto('/#/login');

    await expect(page.getByText('Zaloguj się')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Hasło')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/#/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Hasło').fill('wrongpassword');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    // Should display an error message from Supabase
    await expect(page.getByText(/invalid/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('redirects authenticated user to their dashboard', async ({ page }) => {
    await page.goto('/#/login');

    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Hasło').fill(testPassword);
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    // After successful login, should be redirected to a role-based dashboard
    await expect(page).not.toHaveURL(/\/#\/login/, { timeout: 10000 });
  });

  test('has a link to the signup page', async ({ page }) => {
    await page.goto('/#/login');

    const signupLink = page.getByText('Zarejestruj się');
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
