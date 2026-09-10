import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import { FakeStorage } from "./dom-harness.mjs";

const read = (name) => readFileSync(new URL("./" + name, import.meta.url), "utf8");

function loadTelemetry(config, debug = false) {
  const sent = [];
  const initialized = [];
  const root = {
    LanternTelemetryConfig: config,
    LanternDebug: {enabled:debug},
    localStorage: new FakeStorage(),
    posthog: {
      init(key, options) { initialized.push({ key, options }); },
      capture(name, properties) { sent.push({ name, properties }); },
      opt_in_capturing() {},
      opt_out_capturing() {},
    },
    document: { createElement() { return {}; }, head: { appendChild() {} } },
  };
  root.window = root;
  root.self = root;
  root.globalThis = root;
  vm.createContext(root);
  vm.runInContext(read("telemetry.js"), root, { filename: "telemetry.js" });
  return { telemetry: root.LanternTelemetry, sent, initialized };
}

test("debug sessions never initialize analytics or change the normal analytics preference", () => {
  const loaded = loadTelemetry({projectKey:"phc_test"}, true);
  loaded.telemetry.setEnabled(true);
  loaded.telemetry.track("app_opened", {screen:"title"});
  assert.equal(loaded.telemetry.isEnabled(), false);
  assert.deepEqual(loaded.sent, []);
  assert.deepEqual(loaded.initialized, []);
});

test("telemetry is a no-op until a public project key is configured", () => {
  const loaded = loadTelemetry({ projectKey: "", apiHost: "https://us.i.posthog.com" });
  loaded.telemetry.track("app_opened", { screen: "title" });
  assert.deepEqual(loaded.sent, []);
  assert.deepEqual(loaded.initialized, []);
});

test("telemetry exposes whether this build is configured to collect", () => {
  const off = loadTelemetry({ projectKey: "", apiHost: "https://us.i.posthog.com" });
  const on = loadTelemetry({ projectKey: "phc_test", apiHost: "https://us.i.posthog.com" });

  assert.equal(off.telemetry.isConfigured(), false);
  assert.equal(on.telemetry.isConfigured(), true);
});

test("telemetry sends only allow-listed events and properties", () => {
  const loaded = loadTelemetry({ projectKey: "phc_test", apiHost: "https://us.i.posthog.com" });
  loaded.telemetry.setContext(() => ({ build: "320", screen: "inn", answer: "secret" }));
  loaded.telemetry.track("feedback_submitted", {
    category: "bug",
    details: "button stuck",
    answer: "secret",
    unrelated: "discard me",
  });
  loaded.telemetry.track("answer_selected", { answer: "secret" });
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.sent)), [{
    name: "feedback_submitted",
    properties: { build: "320", screen: "inn", category: "bug", details: "button stuck" },
  }]);
});

test("turning telemetry off stops capture immediately", () => {
  const loaded = loadTelemetry({ projectKey: "phc_test", apiHost: "https://us.i.posthog.com" });
  loaded.telemetry.setEnabled(false);
  loaded.telemetry.track("app_opened", { screen: "title" });
  assert.deepEqual(loaded.sent, []);
  assert.equal(loaded.telemetry.isEnabled(), false);
});

test("an application error reports only its message, source and game context", () => {
  const loaded = loadTelemetry({ projectKey: "phc_test", apiHost: "https://us.i.posthog.com" });
  loaded.telemetry.reportError(new Error("scene missing"), "https://example.test/app.js?player=private", {
    screen: "inn",
    answer: "secret",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.sent)), [{
    name: "app_error",
    properties: { message: "scene missing", source: "app.js", screen: "inn" },
  }]);
});
