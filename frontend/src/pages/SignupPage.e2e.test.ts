import { test, expect } from '../../e2e/console-fixture';

// ═══════════════════════════════════════════════════════════
// E2E: Signup Flow
// ═══════════════════════════════════════════════════════════
//
// Requires a running Supabase instance.
// Uses a unique email per run to avoid conflicts.
// ═══════════════════════════════════════════════════════════

test.describe('Signup', () => {
  test.describe.configure({ mode: 'serial' });

  test('displays the signup form', async ({ page }) => {
    await page.goto('/#/signup');

    await expect(page.getByText('Zarejestruj się')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Hasło')).toBeVisible();
    await expect(page.getByLabel('Imię')).toBeVisible();
    await expect(page.getByLabel('Nazwisko')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zarejestruj' })).toBeVisible();
  });

  test('shows error for an already taken email', async ({ browser }) => {
    // Register a user first to ensure the email is taken
    const dupEmail = `signup-dup-${Date.now()}@example.com`;

    // Use an isolated context for the first registration
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    await page1.goto('/#/signup');
    await page1.getByLabel('Email').fill(dupEmail);
    await page1.getByLabel('Hasło').fill('StrongPass1!');
    await page1.getByLabel('Imię').fill('First');
    await page1.getByLabel('Nazwisko').fill('Register');
    await page1.getByRole('button', { name: 'Zarejestruj' }).click();
    await expect(page1).not.toHaveURL(/\/#\/signup/, { timeout: 15000 });
    await ctx1.close();

    // Fresh context — no cached auth session from the first signup
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await page2.goto('/#/signup');
    await page2.getByLabel('Email').fill(dupEmail);
    await page2.getByLabel('Hasło').fill('StrongPass1!');
    await page2.getByLabel('Imię').fill('Second');
    await page2.getByLabel('Nazwisko').fill('Attempt');
    await page2.getByRole('button', { name: 'Zarejestruj' }).click();

    // Should display an error message from Supabase about duplicate
    await expect(page2.getByText(/already/i).first()).toBeVisible({ timeout: 10000 });
    await ctx2.close();
  });

  test('successfully registers a new user', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    await page.goto('/#/signup');

    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Hasło').fill('StrongPass1!');
    await page.getByLabel('Imię').fill('E2E');
    await page.getByLabel('Nazwisko').fill('Tester');
    await page.getByRole('button', { name: 'Zarejestruj' }).click();

    // After successful signup, should redirect away from signup page
    await expect(page).not.toHaveURL(/\/#\/signup/, { timeout: 15000 });
  });

  test('has a link to the login page', async ({ page }) => {
    await page.goto('/#/signup');

    const loginLink = page.getByText('Zaloguj się');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });
});