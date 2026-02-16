
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Content Regression Tests', () => {
    test('Should have How It Works section', async ({ page }) => {
        await page.goto(`file://${path.resolve(__dirname, '../index.html')}`);

        // Check for specific content that was lost
        await expect(page.locator('#how-it-works')).toBeVisible();
        await expect(page.locator('text=From Datasheet to Digital Twin')).toBeVisible();

        // Verify flow items
        await expect(page.locator('.process-flow')).toBeVisible();
        await expect(page.locator('.process-step')).toHaveCount(4);

        // Verify banner graphic restoration
        await expect(page.locator('.css-graphic.graphic-1')).toBeVisible();
    });
});
