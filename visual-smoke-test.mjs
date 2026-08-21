import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && (target.url.includes("index.html") || target.url.includes("localhost")));
assert.ok(page, "Lantern Alley page is not open in the verification browser");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true });
  return result.result.value;
}

await command("Page.enable");
await evaluate("localStorage.clear(); location.reload()");
await wait(500);
await evaluate("document.getElementById('btn-start').click()");
await wait(100);
await evaluate("document.querySelector('[data-key=\"home-inn\"]').click()");
await wait(250);

for (let index = 0; index < 4; index += 1) {
  await evaluate("document.querySelector('.inn-object').click(); document.querySelector('.inn-target:not(:disabled)').click()");
  await wait(80);
}
await wait(1300);

await evaluate("document.querySelector('[data-inn-action=\"selectReplace\"]').click(); document.querySelectorAll('[data-inn-action=\"replaceTarget\"]')[0].click()");
await wait(100);
await evaluate("document.querySelector('[data-inn-action=\"selectReplace\"]').click(); document.querySelectorAll('[data-inn-action=\"replaceTarget\"]')[1].click()");
await wait(1300);

await evaluate("document.querySelector('.heater-control').dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}))");
await wait(1800);
await evaluate("document.querySelector('.heater-control').dispatchEvent(new PointerEvent('pointerup', {bubbles:true}))");
await wait(1300);

const review = await evaluate(`({
  label: document.getElementById('scene-label').textContent,
  japanese: document.getElementById('jp-line').textContent,
  instruction: document.querySelector('.inn-instruction').textContent,
  clue: document.querySelector('.inn-clue').textContent,
  schedules: document.querySelectorAll('.schedule-controls input').length,
  oldTemperatureMeters: document.querySelectorAll('.temperature-meter').length
})`);

assert.match(review.label, /Coordinate Checkout/);
assert.match(review.japanese, /14時/);
assert.match(review.instruction, /Move the adjustable time card/);
assert.match(review.clue, /Train 14:00/);
assert.equal(review.schedules, 2);
assert.equal(review.oldTemperatureMeters, 0);

const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
writeFileSync(new URL("./moonview-question-review.png", import.meta.url), Buffer.from(screenshot.data, "base64"));
socket.close();
console.log(JSON.stringify(review, null, 2));
