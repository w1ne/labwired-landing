const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve(__dirname, '..');
const importantPages = [
    'index.html',
    'docs.html',
    'resources.html',
    'how-it-works.html',
    'comparisons/qemu.html',
    'comparisons/renode.html',
    'blog/fixing-flaky-firmware-tests.html'
];

function loadHtml(relativePath) {
    return fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');
}

function extractLocalLinks(html) {
    const hrefMatches = [...html.matchAll(/href="([^"]+)"/g)];
    return hrefMatches
        .map((match) => match[1])
        .filter((href) => href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:'))
        .filter((href) => href.startsWith('#') || href.endsWith('.html') || href.includes('.html#'));
}

function resolveLink(fromPage, href) {
    const [targetPath, hash] = href.split('#');
    const normalizedPath = targetPath && targetPath !== '' ? path.normalize(path.join(path.dirname(fromPage), targetPath)) : fromPage;
    return { targetPath: normalizedPath, hash };
}

test.describe('Important page link health', () => {
    for (const relativePage of importantPages) {
        test(`${relativePage} loads`, async ({ page }) => {
            await page.goto(`file://${path.join(siteRoot, relativePage)}`);
            await expect(page).toHaveTitle(/.+/);
        });

        test(`${relativePage} local links resolve`, async () => {
            const html = loadHtml(relativePage);
            const hrefs = extractLocalLinks(html);

            for (const href of hrefs) {
                const { targetPath, hash } = resolveLink(relativePage, href);
                const absoluteTargetPath = path.join(siteRoot, targetPath);

                expect(fs.existsSync(absoluteTargetPath), `${relativePage} -> ${href} points to a missing file`).toBeTruthy();

                if (hash) {
                    const targetHtml = loadHtml(targetPath);
                    const hasId = targetHtml.includes(`id="${hash}"`);
                    expect(hasId, `${relativePage} -> ${href} points to a missing anchor`).toBeTruthy();
                }
            }
        });
    }
});
