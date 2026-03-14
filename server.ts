/**
 * Bun development server
 * Builds the app, serves static files, and watches for changes.
 *
 * Usage: bun run dev
 */

import path from "path";

const PORT = 3000;
const ROOT = import.meta.dir;
const DIST = path.join(ROOT, "dist");

async function build() {
  const result = await Bun.build({
    entrypoints: [path.join(ROOT, "src/main.tsx")],
    outdir: DIST,
    target: "browser",
    sourcemap: "inline",
  });
  if (!result.success) {
    console.error("Build failed:");
    result.logs.forEach((l) => console.error(l));
    return false;
  }
  return true;
}

// Initial build
console.log("Building…");
const ok = await build();
if (!ok) process.exit(1);
console.log(`Built → dist/`);

// MIME type map
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".json": "application/json",
};

function mime(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

// Static file server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Serve index.html for root
    if (pathname === "/" || pathname === "/index.html") {
      const f = Bun.file(path.join(ROOT, "index.html"));
      return new Response(f, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Serve dist files
    if (pathname.startsWith("/dist/")) {
      const f = Bun.file(path.join(ROOT, pathname.slice(1)));
      if (await f.exists()) {
        return new Response(f, {
          headers: { "Content-Type": mime(pathname) },
        });
      }
    }

    // 404
    return new Response("Not found", { status: 404 });
  },
});

console.log(`\n  Dev server → http://localhost:${PORT}\n`);

// Watch for changes and rebuild
const watcher = Bun.file(path.join(ROOT, "src")).stream
  ? undefined
  : undefined; // Bun fs.watch is used below

import { watch } from "fs";
watch(path.join(ROOT, "src"), { recursive: true }, async (event, filename) => {
  if (!filename?.match(/\.(tsx?|jsx?)$/)) return;
  console.log(`  Changed: src/${filename} — rebuilding…`);
  const ok = await build();
  if (ok) console.log("  Rebuilt ✓");
});
