# SEANCE UI audit

Date: 2026-10-30

## Scope

The application currently exposes one user-facing route, `/`. The live page, mobile navigation state, and demo state were captured with Playwright at 1440, 1024, 768, and 390 pixels in both `crypt` and `study` themes. The audit script is `scripts/ui-audit.mjs`.

## Defects found and fixed

1. The study theme flashed correctly from the layout script, then the page client state reset it to the crypt theme during hydration. Theme state now initializes from the document theme and remains stable.
2. The seller action panel overflowed horizontally at 390 pixels. The panel now stacks its content and actions on narrow screens, and its buttons use the available width.
3. The mobile seal visual used an intentional negative right offset that placed its canvas outside the viewport. The visual now stays within the viewport while retaining the intended overlap with the hero copy.

Decorative orbs still extend beyond their visual field by design, but the field clips them and the document has no horizontal scroll. This is intentional atmospheric bleed, not page overflow.

## Results

All 20 live, demo, and mobile menu screenshot scenarios completed for both themes and all four widths. The automated checks found:

- No horizontal document overflow.
- No browser console errors.
- No page errors.
- No hydration warnings.
- Theme selection matched the requested theme in every scenario after the hydration fix.
- The narrow seller action panel stayed inside the viewport after the responsive fix.

The generated screenshots and JSON report are intentionally ignored from Git. Re-run the audit with:

```bash
node scripts/ui-audit.mjs
```
