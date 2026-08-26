/* Build curriculum-catalog.js from the local OpenJLPT files plus the project
 * supplement.
 *
 * Why a build step rather than parsing JSON at runtime: the game must work from
 * file://, where fetch() of a sibling JSON is blocked. Every other data file in
 * this project is a script that assigns to `self` for the same reason.
 *
 * Measured facts this script relies on (see PROJECT-HANDOFF.md):
 *   - n2 and n3 do not overlap; 3,577 unique words combined.
 *   - 294 of n2's 295 blank readings are kana headwords that are their own
 *     reading. Excluding them would drop a sixth of the vocabulary.
 *   - Every example sentence contains its headword exactly, so cloze cards
 *     need no fuzzy matching.
 *
 * Usage: node research/build-n2-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, ROOT), "utf8"));

const KANJI = /[\u4e00-\u9fff]/;
const KANA_ONLY = /^[\u3040-\u30ff\u30fc\u30fb]+$/;

// Hepburn-ish kana to romaji, used only to mint stable ASCII ids.
const ROMA = {
  きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sha",しゅ:"shu",しょ:"sho",ちゃ:"cha",ちゅ:"chu",ちょ:"cho",
  にゃ:"nya",にゅ:"nyu",にょ:"nyo",ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",
  りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",じゃ:"ja",じゅ:"ju",じょ:"jo",
  びゃ:"bya",びゅ:"byu",びょ:"byo",ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo",
  あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"o",ん:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",
  だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",っ:"",ー:"",
};
const kataToHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
function romaji(kana) {
  const hira = kataToHira(kana);
  let out = "";
  for (let i = 0; i < hira.length; i++) {
    const pair = hira.slice(i, i + 2);
    if (ROMA[pair] !== undefined) { out += ROMA[pair]; i++; continue; }
    out += ROMA[hira[i]] !== undefined ? ROMA[hira[i]] : "";
  }
  return out.replace(/[^a-z]/g, "") || "x";
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  // The source stores lists as Python-style literals.
  try {
    return JSON.parse(value.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

function inferType(meanings) {
  const first = String(meanings[0] || "").toLowerCase();
  if (first.startsWith("to ")) return "verb";
  if (first.startsWith("-") || /\bly\b/.test(first)) return "adverb";
  return "word";
}

const PARTITIONS = ["home-inn", "market", "tea-house", "station", "shrine"];

// A story episode teaches about forty words. Those words are pinned to the
// place that teaches them, because the alternative is writing a market scene
// around whichever words the round-robin happened to deal it - the market
// partition held 血液, 競馬 and 国籍. Coverage is a property of the practice
// pool, not of which forty words a story happens to use, so pinning costs
// nothing and makes the Japanese a great deal better.
const PINNED = new Map();
{
  const table = JSON.parse(readFileSync(new URL("research/authored-targets.json", ROOT), "utf8"));
  for (const partition of PARTITIONS) {
    for (const word of table[partition] || []) {
      if (PINNED.has(word)) throw new Error(`${word} is pinned to two places`);
      PINNED.set(word, partition);
    }
  }
}

const excluded = [];
const byWord = new Map();

for (const file of ["research/openjlpt/n2.json", "research/openjlpt/n3.json"]) {
  const level = file.includes("n2") ? "N2" : "N3";
  for (const record of read(file)) {
    const raw = String(record.word || "").trim();
    if (!raw) { excluded.push({ word: "(blank)", reason: "record has no word" }); continue; }

    const meanings = parseList(record.meanings).map(String).filter((m) => m.trim());
    if (!meanings.length) { excluded.push({ word: raw, reason: "record has no meaning" }); continue; }

    const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
    const canonical = parts[0];
    const aliases = parts.slice(1);

    let reading = String(record.reading || "").trim();
    let derivedReading = false;
    if (!reading && KANA_ONLY.test(canonical)) { reading = canonical; derivedReading = true; }
    if (!reading) {
      const reason = KANJI.test(canonical)
        ? "kanji headword with no reading"
        : "headword carries an annotation, so it is neither plain kana nor a kanji word";
      excluded.push({ word: canonical, reason });
      continue;
    }

    if (byWord.has(canonical)) continue;
    byWord.set(canonical, {
      canonical, reading, aliases, meanings,
      examples: parseList(record.examples).filter((e) => e && e.ja).slice(0, 1),
      level, source: "openjlpt", reviewed: false, derivedReading,
      hasKanji: KANJI.test(canonical),
      type: inferType(meanings),
    });
  }
}

for (const item of read("research/n2-supplement.json").items) {
  byWord.set(item.canonical, {
    canonical: item.canonical, reading: item.reading, aliases: item.aliases || [],
    meanings: item.meanings, examples: item.examples || [], level: "N2",
    source: "project", reviewed: false, derivedReading: false,
    hasKanji: KANJI.test(item.canonical), type: item.type, id: item.id, note: item.note,
  });
}

// Stable ids. Sorting first keeps ids identical between runs.
const items = [...byWord.values()].sort((a, b) => a.canonical.localeCompare(b.canonical, "ja"));
const used = new Set();
items.forEach((item, index) => {
  if (!item.id) {
    const prefix = item.type === "verb" ? "v" : "w";
    let id = `${prefix}-${romaji(item.reading)}`;
    let n = 2;
    while (used.has(id)) id = `${prefix}-${romaji(item.reading)}-${n++}`;
    item.id = id;
  }
  used.add(item.id);
  // Round-robin so every location gets a comparable mix rather than one
  // location absorbing every word starting with the same kana - except for
  // the words a story episode actually teaches, which belong to their place.
  item.partition = PINNED.get(item.canonical) || PARTITIONS[index % PARTITIONS.length];
});

const payload = { items, excluded };
writeFileSync(
  new URL("curriculum-catalog.js", ROOT),
  `/* GENERATED by research/build-n2-catalog.mjs. Do not edit by hand. */\n` +
  `(function(root){\n  "use strict";\n  var DATA = ${JSON.stringify(payload)};\n` +
  readFileSync(new URL("research/catalog-api.js", ROOT), "utf8") +
  `\n  root.LanternCurriculumCatalog = API;\n})(typeof self !== "undefined" ? self : this);\n`,
  "utf8",
);

console.log(`items ${items.length}  excluded ${excluded.length}  supplement ${items.filter((i) => i.source === "project").length}`);
