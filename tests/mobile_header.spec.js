
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Mobile Header Tests', () => {
    // We will test against local files to catch regressions before deployment
    const pages = [
        { name: 'index.html', path: `file://${path.resolve(__dirname, '../index.html')}` },
        { name: 'docs.html', path: `file://${path.resolve(__dirname, '../docs.html')}` }
    ];

    for (const pageInfo of pages) {
        test(`Mobile menu should be robust on ${pageInfo.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
            await page.goto(pageInfo.path);

            // 1. Strict Duplicate Check
            const toggles = page.locator('.navPanelToggle');
            const count = await toggles.count();
            expect(count, `CRITICAL: Found ${count} toggles on ${pageInfo.name}. Must be exactly 1.`).toBe(1);

            // 2. CSS Visibility Check (Mobile)
            const toggle = toggles.first();
            await expect(toggle).toBeVisible();
            await expect(toggle).toHaveCSS('display', 'block');

            // 3. Desktop Hidden Check
            await page.setViewportSize({ width: 1280, height: 800 });
            await expect(toggle).not.toBeVisible();
            // Note: display might be 'none' or effective visibility hidden
            // await expect(toggle).toHaveCSS('display', 'none'); 

            // Back to mobile
            await page.setViewportSize({ width: 375, height: 667 });

            // 4. Script Loading Check
            const isScriptLoaded = await page.evaluate(() => {
                const scripts = Array.from(document.scripts);
                return scripts.some(s => s.src.includes('script.js'));
            });
            expect(isScriptLoaded, 'script.js should be loaded').toBeTruthy();

            // 5. Interactivity & Z-Index
            const nav = page.locator('#nav');
            await expect(nav).not.toHaveClass(/navPanel-visible/);

            // Click and verify
            await toggle.click();
            await expect(nav).toHaveClass(/navPanel-visible/);

            // Check z-index to ensure it's on top of other elements
            const zIndex = await nav.evaluate(el => window.getComputedStyle(el).zIndex);
            const zIndexVal = parseInt(zIndex);
            expect(zIndexVal).toBeGreaterThan(100); // Should be high

            // 6. Close by clicking link
            await nav.locator('a').first().click();
            await expect(nav).not.toHaveClass(/navPanel-visible/);
        });
    }
});
