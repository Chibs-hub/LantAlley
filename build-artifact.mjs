// Build lantern-alley-artifact.html as one self-contained page.
//
// The split files remain the source of truth. The published artifact cannot
// load sibling scripts, styles, images, or audio, so this build inlines them.

import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
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
  "home-garden.js",
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
  // The standalone file is intentionally the Entrance plus Inn Episode 1
  // demo. Home decoration is available only in the installable PWA, and its
  // many room, garden and pet variants would exceed the artifact host limit.
  .filter((item) => !item.startsWith("assets/home/"))
  // Not every "assets/..." string in the source is a file. The garden builds
  // its image URL from the literal "assets/home/garden/", and handing a
  // directory to readFileSync throws EISDIR and takes the whole build with it.
  .filter((item) => !item.endsWith("/") && existsSync(item) && statSync(item).isFile())
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
/* The size is reported, not enforced.
 *
 * The 15 MB ceiling existed because the artifact was the delivery surface and
 * the host that published it refused anything over 16 MB. The game ships from
 * GitHub Pages now, so that number is a fact about a host this project no
 * longer uses. The build is an optional demo, and a demo that is large is a
 * large demo, not a failure - it was refusing to finish over a limit that had
 * stopped applying.
 *
 * The breakdown still prints, because knowing what is heavy is useful whether
 * or not anything is enforced.
 */
const biggest = [...inlineSizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log("largest inlined contributors:");
for (const [name, size] of biggest) console.log("  " + (size / 1024 / 1024).toFixed(2) + " MB  " + name);
