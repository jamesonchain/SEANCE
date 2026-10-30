import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const outputDir = path.join(root, "artifacts", "ui-audit");
const widths = [1440, 1024, 768, 390];
const themes = ["crypt", "study"];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const report = [];

for (const theme of themes) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === "study" ? "light" : "dark" });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript((selectedTheme) => localStorage.setItem("seance-theme", selectedTheme), theme);
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outputDir, `${theme}-${width}-live.png`), fullPage: true });
    const metrics = await page.evaluate(() => {
      const viewport = window.innerWidth;
      const overflowing = [...document.querySelectorAll("body *")].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > viewport + 1 || rect.left < -1;
      }).slice(0, 12).map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right) }));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewport,
        scrollY: window.scrollY,
        overflowing,
        focusable: document.querySelectorAll("button, a, input").length,
        theme: document.documentElement.dataset.theme,
      };
    });
    report.push({ theme, width, state: "live", metrics, consoleErrors, pageErrors });

    if (width <= 768) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.screenshot({ path: path.join(outputDir, `${theme}-${width}-menu.png`), fullPage: true });
      report.push({ theme, width, state: "menu", metrics: await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth })), consoleErrors, pageErrors });
    }

    await page.getByRole("button", { name: /Demo mode|Live mode/ }).click();
    await page.screenshot({ path: path.join(outputDir, `${theme}-${width}-demo.png`), fullPage: true });
    report.push({ theme, width, state: "demo", metrics: await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth })), consoleErrors, pageErrors });
    await context.close();
  }
}

await fs.writeFile(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 2));
