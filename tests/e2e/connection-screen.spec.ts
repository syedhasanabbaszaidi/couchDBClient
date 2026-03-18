import { test, expect } from '@playwright/test';
import { waitForAppReady, removeEmergentBadge, dismissToasts } from '../fixtures/helpers';

test.describe('CouchDB Client - Connection Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await removeEmergentBadge(page);
    await dismissToasts(page);
  });

  test('Connection screen loads with all form fields', async ({ page }) => {
    // Verify all form elements are present
    await expect(page.getByTestId('connection-name-input')).toBeVisible();
    await expect(page.getByTestId('connection-url-input')).toBeVisible();
    await expect(page.getByTestId('connection-username-input')).toBeVisible();
    await expect(page.getByTestId('connection-password-input')).toBeVisible();
    await expect(page.getByTestId('connect-btn')).toBeVisible();
    await expect(page.getByTestId('save-connection-btn')).toBeVisible();

    // Verify header
    await expect(page.getByText('CouchDB Client')).toBeVisible();
    await expect(page.getByText('Connect to your database')).toBeVisible();
  });

  test('Connection form has default URL pre-filled', async ({ page }) => {
    const urlInput = page.getByTestId('connection-url-input');
    await expect(urlInput).toHaveValue('http://localhost:9004');
  });

  test('Connect button triggers connection attempt when clicked', async ({ page }) => {
    const connectBtn = page.getByTestId('connect-btn');
    await expect(connectBtn).toBeVisible();
    
    // Click connect - it will try to connect
    await connectBtn.click();
    
    // Either shows Connecting... text OR shows error toast (since no real CouchDB)
    // We verify something happens (either loading state or error feedback)
    const connectingText = page.getByText('Connecting...');
    const errorToast = page.locator('[data-sonner-toast]').first();
    
    // Wait for either loading text OR error toast to appear
    await expect(connectingText.or(errorToast)).toBeVisible();
  });

  test('Form inputs accept user input correctly', async ({ page }) => {
    const nameInput = page.getByTestId('connection-name-input');
    const urlInput = page.getByTestId('connection-url-input');
    const usernameInput = page.getByTestId('connection-username-input');
    const passwordInput = page.getByTestId('connection-password-input');

    await nameInput.fill('Test Server');
    await urlInput.fill('http://testserver:5984');
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpass');

    await expect(nameInput).toHaveValue('Test Server');
    await expect(urlInput).toHaveValue('http://testserver:5984');
    await expect(usernameInput).toHaveValue('testuser');
    await expect(passwordInput).toHaveValue('testpass');
  });

  test('Save button is visible and clickable', async ({ page }) => {
    const saveBtn = page.getByTestId('save-connection-btn');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();
  });

  test('Saving connection without name shows error toast', async ({ page }) => {
    const saveBtn = page.getByTestId('save-connection-btn');
    await saveBtn.click();
    
    // Should show error toast about needing a name
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });
});
