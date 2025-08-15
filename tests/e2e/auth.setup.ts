import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  
  // Fill login form with test credentials
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  
  // Click login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login
  await expect(page).toHaveURL('/prompts');
  
  // Wait for user to be loaded
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});