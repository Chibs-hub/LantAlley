// Build lantern-alley-artifact.html as one self-contained page.
//
// The split files remain the source of truth. The published artifact cannot
// load sibling scripts, styles, images, or audio, so this build inlines them.

import { readFileSync, writeFileSync, statSync } from "node:fs";
import vm from "node:vm";
import { extname } from "node:path";

const output = "lantern-alley-artifact.html";
const scripts = [
  "entrance-stage-logic.js",
  "moonview-inn-interactions.js",
  "n2-home-inn-stage.js",
  "n2-inn-episodes.js",
  "n2-market-episodes.js",
  "n2-teahouse-episodes.js",
  "n2-station-episodes.js",
  "n2-shrine-episodes.js",
  "audio-index.js",
  "curriculum-catalog.js",
  "learning-content.js",
  "review-engine.js",
  "learning-progress.js",
  "learning-economy.js",
  "learning-gloss.js",
  "home-room.js",
  "home-decor.js",
  "daily-practice.js",
  "review-mode.js",
  "question-renderer.js",
  "catalog-practice.js",
  "lantern-map.js",
  "app.js",
];
const mime = {
  ".mp3": "audio/mpeg",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const read = (file) => readFileSync(file, "utf8");
const dataUri = (file) => {
  const type = mime[extname(file).toLowerCase()] || "application/octet-stream";
  return "data:" + type + ";base64," + readFileSync(file).toString("base64");
};

const inlineSizes = new Map();

let html = read("index.html");

// The artifact host supplies the outer document wrapper.
html = html.replace(/<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*/i, "");
html = html.replace(/\s*<\/head>\s*<body>\s*/i, "\n");
html = html.replace(/\s*<\/body>\s*<\/html>\s*$/i, "\n");

// PWA wiring is invalid inside the sandboxed artifact host.
html = html.replace(/[ \t]*<link rel="manifest"[^>]*>\r?\n?/gi, "");
html = html.replace(/[ \t]*<link rel="apple-touch-icon"[^>]*>\r?\n?/gi, "");
html = html.replace(/[ \t]*<link rel="icon"[^>]*>\r?\n?/gi, "");
html = html.replace(/[ \t]*<meta name="apple-mobile-web-app[^>]*>\r?\n?/gi, "");
html = html.replace(/[ \t]*<!-- iOS ignores the manifest[^>]*-->\r?\n?/gi, "");
html = html.replace(/\n<script>\s*\/\/ Service workers need http\(s\)[\s\S]*?<\/script>\n/, "\n");

html = html.replace(
  // The page stamps a cache version onto the URL; the inlined build has no URLs.
  /<link rel="stylesheet" href="styles\.css(\?v=\d+)?">/,
  "<style>\n" + read("styles.css") + "</style>",
);

// The artifact is a demo - the Entrance plus Inn Episode 1 - not the course.
// It cannot hold the full course anyway, and the whole 3,579-item catalog is
// roughly 1.1 MB of words the demo never asks about. Ship only the Inn's
// partition and keep the rest for the PWA build.
function demoCatalog() {
  const context = { self: {} };
  context.self = context;
  vm.createContext(context);
  vm.runInContext(read("curriculum-catalog.js"), context);
  const full = context.LanternCurriculumCatalog;
  const taught = new Set();
  vm.runInContext(read("learning-content.js"), context);
  vm.runInContext(read("n2-inn-episodes.js"), context);
  for (const episode of context.N2InnEpisodes.episodes) {
    for (const day of episode.days) for (const question of day.questions) taught.add(question.target);
  }
  const items = full.items.filter((item) => item.partition === "home-inn" || taught.has(item.id));
  const payload = JSON.stringify({ items, excluded: full.excluded });
  return `/* GENERATED demo subset: Inn partition only. */
(function(root){
  "use strict";
  var DATA = ${payload};
`
    + read("research/catalog-api.js")
    + `
  root.LanternCurriculumCatalog = API;
})(typeof self !== "undefined" ? self : this);
`;
}

for (const name of scripts) {
  // The page stamps a version onto each URL so a browser cannot serve a stale
  // script; the inlined build has no URLs at all, so the stamp is dropped here.
  const stamped = new RegExp('<script src="' + name.replace(/[.]/g, "[.]") + '(\\?v=\\d+)?"></script>');
  const found = stamped.exec(html);
  if (!found) throw new Error("missing script tag for " + name);
  const tag = found[0];
  const source = name === "curriculum-catalog.js" ? demoCatalog() : read(name);
  inlineSizes.set(name, source.length);
  html = html.replace(tag, "<script>" + String.fromCharCode(10) + source + "</script>");
}

const images = [...html.matchAll(/["']((?:assets\/[^"']+|[\w.-]+\.ico))["']/g)]
  .map((match) => match[1])
  .filter((item, index, all) => all.indexOf(item) === index)
  .sort();

for (const relative of images) {
  const uri = dataUri(relative);
  html = html.split('"' + relative + '"').join('"' + uri + '"');
  html = html.split("'" + relative + "'").join("'" + uri + "'");
}

writeFileSync(output, html, "utf8");
const bytes = statSync(output).size;
console.log("inlined " + scripts.length + " scripts, 1 stylesheet, " + images.length + " images");
console.log(output + "  " + (bytes / 1024 / 1024).toFixed(2) + " MB");
// Fail loudly rather than emitting a file that cannot be published. The 15 MB
// ceiling leaves headroom under the host's hard 16 MB limit.
if (bytes > 15 * 1024 * 1024) {
  const biggest = [...inlineSizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.error("largest inlined contributors:");
  for (const [name, size] of biggest) console.error("  " + (size / 1024 / 1024).toFixed(2) + " MB  " + name);
  throw new Error("artifact is " + (bytes / 1024 / 1024).toFixed(2) + " MB, above the 15 MB ceiling");
}
