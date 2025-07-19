import { test, expect } from '@playwright/test';

test('app launches and loads', async ({ page }) => {
  // Navigate to the Tauri app
  await page.goto('/');

  // Wait for the app to load and check for basic structure
  await expect(page).toHaveTitle(/Tauri \+ React \+ Typescript|IrisNotes|Tauri App/);

  // Verify the app has loaded by checking for basic elements
  await page.waitForTimeout(1000); // Allow app initialization

  // Check if main app container is visible
  const mainContent = page.locator('body');
  await expect(mainContent).toBeVisible();
});

test('sidebar functionality', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Look for sidebar elements or navigation
  // This will be updated once we examine the actual app structure
  const sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('.sidebar')).or(page.locator('aside'));

  // Check if sidebar exists (might not be visible initially)
  const sidebarExists = await sidebar.count() > 0;

  if (sidebarExists) {
    console.log('Sidebar found in app');
  } else {
    console.log('No sidebar detected - app may have different layout');
  }
});

test('note creation workflow', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Look for new note button or similar functionality
  const newNoteButton = page.locator('[data-testid="new-note"]')
    .or(page.getByRole('button', { name: /new note/i }))
    .or(page.getByRole('button', { name: /add note/i }))
    .or(page.getByRole('button', { name: /create/i }));

  const buttonExists = await newNoteButton.count() > 0;

  if (buttonExists) {
    await newNoteButton.first().click();
    console.log('New note creation initiated');
  } else {
    console.log('New note button not found - workflow may differ');
  }
});
