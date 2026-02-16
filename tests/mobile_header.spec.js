
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Mobile Header Tests', () => {
    // We will test against local files to catch regressions before deployment
    const pages = [
        { name: 'index.html', path: `file://${path.resolve(__dirname, '../index.html')}` },
        { name: 'docs.html', path: `file://${path.resolve(__dirname, '../docs.html')}` }
    ];

    for (const pageInfo of pages) {
        test(`Mobile menu should work on ${pageInfo.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
            await page.goto(pageInfo.path);

            // 1. Check for duplicate toggles
            const toggles = page.locator('.navPanelToggle');
            const count = await toggles.count();
            expect(count, `Should have exactly 1 toggle on ${pageInfo.name}, found ${count}`).toBe(1);

            // 2. Check menu is hidden initially
            const nav = page.locator('#nav');
            await expect(nav).not.toHaveClass(/navPanel-visible/);

            // 3. Click toggle
            await toggles.first().click();

            // 4. Check menu is visible
            await expect(nav).toHaveClass(/navPanel-visible/);

            // 5. Check icon changed to 'fa-times'
            const icon = toggles.first().locator('i');
            await expect(icon).toHaveClass(/fa-times/);

            // 6. Click again to close
            await toggles.first().click();
            await expect(nav).not.toHaveClass(/navPanel-visible/);
            await expect(icon).toHaveClass(/fa-bars/);
        });
    }
});
