/* Move every correct answer to a position decided by its question id.
 *
 * Authored by hand, the correct choice lands first far too often - it was 73%
 * of main answers and 100% of repair forms, which means "always tap the top
 * one" scored 73% without reading any Japanese. That is not a hard test made
 * easy; it is not a test at all.
 *
 * The position comes from a hash of the question id, so it is stable across
 * runs (re-running never reshuffles a question that has not changed) and has no
 * pattern a learner could ride. Options and their notes move together, and
 * correctIndex follows, so the data stays true.
 *
 * Usage: node research/balance-answers.mjs [file...]
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILES = process.argv.slice(2);
if (!FILES.length) {
  console.error("usage: node research/balance-answers.mjs <episode file>...");
  process.exit(1);
}

// FNV-1a: small, stable, and good enough to scatter a few hundred ids.
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Split the inside of a JS array literal into its top-level elements, leaving
// each element's source text untouched. String-aware so a comma or bracket
// inside a Japanese string is not treated as structure.
function splitElements(source) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "[" || ch === "(" || ch === "{") depth += 1;
    else if (ch === "]" || ch === ")" || ch === "}") depth -= 1;
    else if (ch === "," && depth === 0) {
      parts.push(source.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

// The span of the array literal that starts at `open` (index of its "[").
function arraySpan(text, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return { start: open, end: i + 1 };
    }
  }
  throw new Error("unterminated array at " + open);
}

function reorder(elements, order) {
  // Keep each element's own leading whitespace shape by trimming and re-joining
  // with the separator the original used.
  const trimmed = elements.map((e) => e.trim());
  return order.map((i) => trimmed[i]);
}

// Where the correct answer should sit, from the question id alone.
function targetIndex(id, count, salt) {
  return hash(id + "|" + salt) % count;
}

// A stable arrangement of the wrong answers around the correct one.
function permutation(id, count, correct, salt) {
  const wrong = [];
  for (let i = 0; i < count; i += 1) if (i !== correct) wrong.push(i);
  // Deterministic Fisher-Yates driven by the same hash.
  let h = hash(id + "|order|" + salt);
  for (let i = wrong.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 0x01000193) >>> 0;
    const j = h % (i + 1);
    const t = wrong[i]; wrong[i] = wrong[j]; wrong[j] = t;
  }
  const want = targetIndex(id, count, salt);
  const order = [];
  let w = 0;
  for (let i = 0; i < count; i += 1) order.push(i === want ? correct : wrong[w++]);
  return { order, want };
}

let totalQuestions = 0;
const spread = { answer: [0, 0, 0, 0], repair: [0, 0] };

for (const file of FILES) {
  let text = readFileSync(file, "utf8");
  // Each question starts with its own id string; ids are unique per file.
  const ids = [...text.matchAll(/\("([a-z0-9-]+-q\d+)",/g)].map((m) => ({ id: m[1], at: m.index }));
  // Work backwards so earlier offsets stay valid as we rewrite.
  for (let n = ids.length - 1; n >= 0; n -= 1) {
    const { id, at } = ids[n];
    const blockEnd = n + 1 < ids.length ? ids[n + 1].at : text.length;
    let block = text.slice(at, blockEnd);

    // 1. The answer: options array, its correctIndex, and the notes array that
    //    runs parallel to it.
    const optionsAt = block.indexOf("options:[");
    if (optionsAt < 0) continue;
    const optionsSpan = arraySpan(block, block.indexOf("[", optionsAt));
    const options = splitElements(block.slice(optionsSpan.start + 1, optionsSpan.end - 1));
    const correctMatch = /correctIndex:(\d+)/.exec(block.slice(optionsSpan.end));
    if (!correctMatch) continue;
    const correct = Number(correctMatch[1]);
    const { order, want } = permutation(id, options.length, correct, "answer");

    // The notes array runs parallel to the options: it is the last array in the
    // block with exactly as many elements, all of them strings. Searching
    // backwards and checking beats guessing at a bracket - the block also holds
    // the repair form's own array, and a stray bracket would derail it.
    let notes = null;
    let notesSpan = null;
    for (let i = block.length - 1; i > optionsSpan.end; i -= 1) {
      if (block[i] !== "[") continue;
      let span;
      try { span = arraySpan(block, i); } catch (err) { continue; }
      const parts = splitElements(block.slice(span.start + 1, span.end - 1));
      if (parts.length === options.length && parts.every((part) => /^\s*"/.test(part))) {
        notes = parts;
        notesSpan = span;
        break;
      }
    }

    // A sentence-assembly item must never end up showing its pieces in the
    // order they belong in: the star position alone would then answer it
    // without reading the Japanese. Shuffling can land on that order by
    // chance, so re-salt until it does not. Decided here, before anything is
    // rewritten, because the notes have to follow the same order.
    let finalOrder = order;
    let finalWant = want;
    if (/sentence-order/.test(block)) {
      const joined = (list) => list.map((s) => s.trim().replace(/^"|"$/g, "")).join("");
      for (let salt = 0; salt < 32; salt += 1) {
        const candidate = salt === 0
          ? { order, want }
          : permutation(id, options.length, correct, "answer" + salt);
        if (!block.includes(joined(reorder(options, candidate.order)))) {
          finalOrder = candidate.order;
          finalWant = candidate.want;
          break;
        }
      }
    }

    // Rewrite from the back of the block forwards.
    if (notes && notesSpan) {
      const rebuilt = "[\n            " + reorder(notes, finalOrder).join(",\n            ") + "\n          ]";
      block = block.slice(0, notesSpan.start) + rebuilt + block.slice(notesSpan.end);
    }

    // 2. The repair form, which had every correct answer in slot zero.
    const repairAt = block.indexOf("options:[", optionsSpan.end);
    if (repairAt >= 0) {
      const repairSpan = arraySpan(block, block.indexOf("[", repairAt));
      const repairOptions = splitElements(block.slice(repairSpan.start + 1, repairSpan.end - 1));
      const repairCorrect = /correctIndex:(\d+)/.exec(block.slice(repairSpan.end));
      if (repairCorrect) {
        const rc = Number(repairCorrect[1]);
        const rp = permutation(id, repairOptions.length, rc, "repair");
        const rebuilt = "[" + reorder(repairOptions, rp.order).join(",") + "]";
        const tail = block.slice(repairSpan.end).replace(/correctIndex:\d+/, "correctIndex:" + rp.want);
        block = block.slice(0, repairSpan.start) + rebuilt + tail;
        spread.repair[rp.want] += 1;
      }
    }

    const rebuiltOptions = "[" + reorder(options, finalOrder).join(",") + "]";
    const afterOptions = block
      .slice(optionsSpan.end)
      .replace(/correctIndex:\d+/, "correctIndex:" + finalWant);
    block = block.slice(0, optionsSpan.start) + rebuiltOptions + afterOptions;

    spread.answer[finalWant] += 1;
    totalQuestions += 1;
    text = text.slice(0, at) + block + text.slice(blockEnd);
  }
  writeFileSync(file, text, "utf8");
  console.log("balanced", file);
}

const pct = (n) => Math.round((100 * n) / totalQuestions) + "%";
console.log(`${totalQuestions} questions`);
console.log("answer position:", spread.answer.map(pct).join(" / "));
console.log("repair position:", spread.repair.map(pct).join(" / "));
