// Build lantern-alley-artifact.html as one self-contained page.
//
// The split files remain the source of truth. The published artifact cannot
// load sibling scripts, styles, images, or audio, so this build inlines them.

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const output = "lantern-alley-artifact.html";
const scripts = [
  "entrance-stage-logic.js",
  "moonview-inn-interactions.js",
  "n2-home-inn-stage.js",
  "audio-index.js",
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
  '<link rel="stylesheet" href="styles.css">',
  "<style>\n" + read("styles.css") + "</style>",
);

for (const name of scripts) {
  const tag = '<script src="' + name + '"></script>';
  if (!html.includes(tag)) throw new Error("missing script tag for " + name);
  html = html.replace(tag, "<script>\n" + read(name) + "</script>");
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
if (bytes > 16 * 1024 * 1024) throw new Error("artifact exceeds the 16 MB limit");
