import type { TestRunnerConfig } from '@storybook/test-runner';
import { waitForPageReady } from '@storybook/test-runner';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const screenshotDir = path.join(__dirname, '../storybook-screenshots');

const config: TestRunnerConfig = {
    async postVisit(page, context) {
        await waitForPageReady(page);
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshot = await page.screenshot({ fullPage: true });
        const safeId = context.id.replace(/[^a-zA-Z0-9_-]/g, '-');
        await fs.promises.writeFile(path.join(screenshotDir, `${safeId}.png`), screenshot);
    },
};

export default config;
