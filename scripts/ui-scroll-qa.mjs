import { chromium, webkit } from "playwright";

const browsers = [
  ["chromium", chromium, { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }],
  ["webkit", webkit, {}],
];

for (const [name, engine, options] of browsers) {
  const browser = await engine.launch({ headless: true, ...options });
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 } });
  await page.goto("http://127.0.0.1:3000/#how", { waitUntil: "networkidle" });
  const initial = await page.evaluate(() => ({ scrollY: window.scrollY, hash: window.location.hash, restoration: history.scrollRestoration }));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.goBack({ waitUntil: "networkidle" });
  const afterBack = await page.evaluate(() => window.scrollY);
  if (initial.scrollY !== 0 || initial.hash !== "" || initial.restoration !== "manual" || afterReload !== 0 || afterBack !== 0) {
    throw new Error(`${name} scroll reset failed: ${JSON.stringify({ initial, afterReload, afterBack })}`);
  }
  console.log(`${name}: scroll reset passed`);
  await browser.close();
}
