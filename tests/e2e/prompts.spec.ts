import { test, expect } from '@playwright/test';

test.describe('Prompts Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prompts');
  });

  test('should display prompts library page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Prompt Library');
    await expect(page.locator('[data-testid="new-prompt-button"]')).toBeVisible();
  });

  test('should create a new prompt', async ({ page }) => {
    // Click new prompt button
    await page.click('[data-testid="new-prompt-button"]');
    await expect(page).toHaveURL('/prompts/new');

    // Fill form
    await page.fill('[data-testid="prompt-name"]', 'E2E Test Prompt');
    await page.fill('[data-testid="prompt-description"]', 'This is a test prompt created by E2E tests');
    await page.fill('[data-testid="prompt-template"]', 'Write a {{type}} about {{topic}}');
    await page.fill('[data-testid="prompt-tags"]', 'e2e, test, automation');

    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click('[data-testid="category-option-testing"]');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Should redirect to prompts page
    await expect(page).toHaveURL('/prompts');
    
    // Should show success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('Prompt Created!');
    
    // Should display the new prompt
    await expect(page.locator('[data-testid="prompt-card"]').first()).toContainText('E2E Test Prompt');
  });

  test('should edit an existing prompt', async ({ page }) => {
    // Assume there's at least one prompt
    const firstPrompt = page.locator('[data-testid="prompt-card"]').first();
    await expect(firstPrompt).toBeVisible();

    // Click edit button
    await firstPrompt.locator('[data-testid="menu-button"]').click();
    await page.click('[data-testid="edit-button"]');

    // Should navigate to edit page
    await expect(page.url()).toMatch(/\/prompts\/[^\/]+\/edit/);

    // Update the name
    const nameInput = page.locator('[data-testid="prompt-name"]');
    await nameInput.fill('Updated E2E Test Prompt');

    // Save changes
    await page.click('[data-testid="submit-button"]');

    // Should redirect back
    await expect(page).toHaveURL('/prompts');
    
    // Should show success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('Prompt Updated!');
  });

  test('should delete a prompt', async ({ page }) => {
    // Assume there's at least one prompt
    const firstPrompt = page.locator('[data-testid="prompt-card"]').first();
    await expect(firstPrompt).toBeVisible();

    // Get the prompt name for verification
    const promptName = await firstPrompt.locator('[data-testid="prompt-title"]').textContent();

    // Click delete button
    await firstPrompt.locator('[data-testid="menu-button"]').click();
    await page.click('[data-testid="delete-button"]');

    // Confirm deletion in dialog
    await expect(page.locator('[data-testid="delete-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete"]');

    // Should show success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('Prompt Deleted');
    
    // Prompt should no longer exist
    if (promptName) {
      await expect(page.locator(`text=${promptName}`)).not.toBeVisible();
    }
  });

  test('should export a prompt', async ({ page }) => {
    // Assume there's at least one prompt
    const firstPrompt = page.locator('[data-testid="prompt-card"]').first();
    await expect(firstPrompt).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await firstPrompt.locator('[data-testid="menu-button"]').click();
    await page.click('[data-testid="export-button"]');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*_prompt\.json$/);

    // Should show success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('Prompt Exported');
  });

  test('should filter prompts by category', async ({ page }) => {
    // Wait for AI categories to load
    await page.waitForSelector('[data-testid="ai-categories"]', { timeout: 10000 });

    // Click on a category
    const categoryButton = page.locator('[data-testid="category-button"]').first();
    await categoryButton.click();

    // Verify filtering works
    const promptCards = page.locator('[data-testid="prompt-card"]');
    await expect(promptCards.first()).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty response or navigate to empty state
    await page.route('**/api/prompts**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prompts: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        })
      });
    });

    await page.reload();
    
    // Should show empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=Your prompt library is empty')).toBeVisible();
    await expect(page.locator('[data-testid="create-first-prompt"]')).toBeVisible();
  });

  test('should optimize a prompt', async ({ page }) => {
    // Navigate to create prompt
    await page.goto('/prompts/new');

    // Fill in a basic template
    await page.fill('[data-testid="prompt-template"]', 'Write something about AI');

    // Click optimize button
    await page.click('[data-testid="optimize-button"]');

    // Should open optimizer dialog
    await expect(page.locator('[data-testid="optimizer-dialog"]')).toBeVisible();

    // Should show optimized version
    await expect(page.locator('[data-testid="optimized-prompt"]')).toBeVisible();

    // Apply optimization
    await page.click('[data-testid="apply-optimization"]');

    // Should close dialog and update template
    await expect(page.locator('[data-testid="optimizer-dialog"]')).not.toBeVisible();
    
    const templateValue = await page.locator('[data-testid="prompt-template"]').inputValue();
    expect(templateValue).toContain('Enhanced:');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/prompts');
    
    // Should display properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="new-prompt-button"]')).toBeVisible();
    
    // Test mobile navigation
    const firstPrompt = page.locator('[data-testid="prompt-card"]').first();
    if (await firstPrompt.isVisible()) {
      await firstPrompt.locator('[data-testid="menu-button"]').click();
      await expect(page.locator('[data-testid="edit-button"]')).toBeVisible();
    }
  });
});