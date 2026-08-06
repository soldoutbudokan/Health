/**
 * Fold the exported site into one self-contained HTML file.
 *
 * This exists because the site can be correct and still be unreachable. On
 * August 6, 2026 GitHub Pages spent an afternoon failing to publish while every
 * build passed, and the log was right on `main` the whole time with no way to
 * look at it. A snapshot is the answer to "the data is fine, I just can't see
 * it" — one file, no server, no network, opens from a phone or a laptop.
 *
 * It deliberately does NOT recompute anything. Every number here was rendered
 * by the real app during `next build`; this script only inlines the stylesheet,
 * drops the JavaScript and stitches the five pages together. That matters —
 * a snapshot that did its own arithmetic would be a second implementation of
 * the maths, and this repo has already learned what two copies of the truth
 * cost. If a figure is wrong here, it is wrong on the site too.
 *
 * What is lost, and why it is acceptable: the pages are pre-rendered at their
 * initial state, so day-stepping, the theme toggle and the food search do
 * nothing. A snapshot is a frozen view of one moment — stepping to yesterday
 * is what the live site is for. The controls are marked `disabled` rather than
 * left looking clickable, because a dead button that looks alive reads as a
 * bug.
 *
 * Dark mode survives. Theming is driven by `prefers-color-scheme` in the CSS,
 * and only the manual override needed JavaScript.
 *
 * Usage: npm run snapshot   (runs the build first, then this)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const target = join(root, "snapshot.html");

const LIVE = "https://soldoutbudokan.github.io/Health";

/** Page order matches the nav. `id` becomes the in-file anchor. */
const PAGES = [
  { file: "index.html", id: "today", label: "Today" },
  { file: "history.html", id: "history", label: "History" },
  { file: "foods.html", id: "foods", label: "Foods" },
  { file: "training.html", id: "training", label: "Training" },
  { file: "program.html", id: "program", label: "Program" },
];

if (!existsSync(outDir)) {
  console.error(
    "No out/ directory. Run `npm run build` first, or use `npm run snapshot`\n" +
      "which does both.",
  );
  process.exit(1);
}

/** Everything between the first <main> and the last </main>. */
function mainOf(html) {
  const start = html.indexOf("<main");
  const end = html.lastIndexOf("</main>");
  if (start === -1 || end === -1) {
    throw new Error("no <main> found — did the export layout change?");
  }
  return html.slice(start, end + "</main>".length);
}

/**
 * Strip every script: the chunk tags, the preload hints, and the inline
 * `self.__next_f.push` payloads that carry React's hydration data. The
 * payloads are the bulk of the file and are useless without the runtime.
 */
function stripScripts(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<script\b[^>]*\/>/g, "")
    .replace(/<link\b[^>]*\bas="script"[^>]*>/g, "")
    .replace(/<link\b[^>]*rel="preload"[^>]*>/g, "");
}

/**
 * Rewrite the app's own links. Anything that maps to a page in this file
 * becomes an anchor; anything else points at the live site, so a snapshot
 * mailed to someone still leads back to the real thing.
 */
function rewriteLinks(html) {
  const byPath = new Map([
    ["/Health", "#today"],
    ["/Health/", "#today"],
    ...PAGES.filter((p) => p.id !== "today").map((p) => [
      `/Health/${p.id}`,
      `#${p.id}`,
    ]),
  ]);

  return html.replace(/href="(\/Health[^"]*)"/g, (whole, path) => {
    const clean = path.replace(/\/$/, "") || "/Health";
    if (byPath.has(path)) return `href="${byPath.get(path)}"`;
    if (byPath.has(clean)) return `href="${byPath.get(clean)}"`;
    return `href="${LIVE}${path.slice("/Health".length)}"`;
  });
}

/** Controls that need JavaScript are inert here; say so rather than imply otherwise. */
function disableControls(html) {
  return html
    .replace(/<button\b(?![^>]*\bdisabled\b)/g, '<button disabled data-snapshot-inert="true" ')
    .replace(/<select\b(?![^>]*\bdisabled\b)/g, '<select disabled data-snapshot-inert="true" ')
    .replace(/<input\b(?![^>]*\bdisabled\b)/g, '<input disabled data-snapshot-inert="true" ');
}

/* ------------------------------------------------------------------ build */

const first = readFileSync(join(outDir, PAGES[0].file), "utf8");

// One stylesheet, shared by every page — inline it once.
const cssHrefs = [...first.matchAll(/href="(\/Health[^"]*\.css)"/g)].map((m) => m[1]);
if (cssHrefs.length === 0) throw new Error("no stylesheet link found in the export");
const css = cssHrefs
  .map((href) => readFileSync(join(outDir, href.slice("/Health/".length)), "utf8"))
  .join("\n");

const sections = PAGES.map(({ file, id, label }) => {
  const path = join(outDir, file);
  if (!existsSync(path)) {
    console.warn(`  skipped ${file} — not in the export`);
    return "";
  }
  const body = disableControls(rewriteLinks(stripScripts(mainOf(readFileSync(path, "utf8")))));
  return `<section id="${id}" class="snapshot-page" aria-label="${label}">${body}</section>`;
}).join("\n");

const nav = PAGES.map(
  (p, i) =>
    `<a href="#${p.id}" class="snapshot-navlink${i === 0 ? " is-first" : ""}">${p.label}</a>`,
).join("");

const stamp = new Date();
const stampText = stamp.toLocaleString("en-CA", {
  dateStyle: "long",
  timeStyle: "short",
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Health — snapshot</title>
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f9f7">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0d0d0d">
<style>
${css}
</style>
<style>
  /* Snapshot chrome. Deliberately built from the app's own custom properties
     so it inherits both themes instead of hard-coding two more colours. */
  .snapshot-bar {
    position: sticky; top: 0; z-index: 40;
    display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem 1rem;
    padding: .7rem 1rem;
    background: var(--surface-2, #eceae4);
    border-bottom: 1px solid var(--hairline, rgba(0,0,0,.1));
    font-size: .8125rem;
  }
  .snapshot-bar strong { font-weight: 600; }
  .snapshot-bar .snapshot-note { color: var(--ink-2, #555); }
  .snapshot-nav { display: flex; flex-wrap: wrap; gap: .25rem; margin-left: auto; }
  .snapshot-navlink {
    padding: .2rem .6rem; border-radius: .5rem; text-decoration: none;
    color: var(--ink-2, #555); font-weight: 500;
  }
  .snapshot-navlink:hover { background: var(--surface, #fff); color: var(--ink, #111); }
  .snapshot-page + .snapshot-page { border-top: 1px solid var(--hairline, rgba(0,0,0,.1)); }
  .snapshot-page { scroll-margin-top: 3.5rem; }
  /* Anything that needed JavaScript. Dimmed so it reads as switched off
     rather than broken. */
  [data-snapshot-inert] { opacity: .45; cursor: not-allowed; }
</style>
</head>
<body>
<div class="snapshot-bar">
  <strong>Static snapshot</strong>
  <span class="snapshot-note">Generated ${stampText} · controls disabled · <a href="${LIVE}">live site</a></span>
  <nav class="snapshot-nav">${nav}</nav>
</div>
${sections}
</body>
</html>
`;

writeFileSync(target, html);

const kb = (html.length / 1024).toFixed(0);
console.log(`snapshot.html written — ${kb} kB, ${PAGES.length} pages, no network needed.`);
