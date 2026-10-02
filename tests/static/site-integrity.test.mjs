import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), "utf8");

test("local assets referenced by index.html exist", async () => {
  const html = await read("index.html");
  const references = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)]
    .map((match) => match[1])
    .filter((value) => !/^(?:https?:|data:|mailto:|tel:)/.test(value));

  for (const reference of references) {
    const details = await stat(path.join(root, reference));
    assert.ok(details.isFile(), `${reference} should resolve to a file`);
  }
});

test("frontend files do not contain Supabase service-role credentials", async () => {
  const frontend = await Promise.all(["supabase-config.js", "app.js", "admin/admin.js"].map(read));
  const forbidden = /service[_-]?role|SUPABASE_SERVICE_ROLE_KEY|postgres(?:ql)?:\/\//i;
  frontend.forEach((source) => assert.doesNotMatch(source, forbidden));
});

test("public version labels agree on V10.10", async () => {
  const [readme, app] = await Promise.all([read("README.md"), read("app.js")]);
  assert.match(readme, /V10\.10/);
  assert.match(app, /Rizvisions OS 10\.10/);
  assert.match(app, /Version 10\.10/);
});

test("desktop uses a text-free blur-to-focus intro", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("app.js")]);
  assert.match(html, /class="focus-pending"/);
  assert.match(html, /id="focusIntro"/);
  assert.match(app, /function playFocusIntro/);
  assert.doesNotMatch(html, /bootIntro|boot-hello|class="boot-pending"/);
  assert.doesNotMatch(app, /runBootIntro|rizvisions-intro/);
});

test("Terminal keeps a text-only natural-language interface", async () => {
  const app = (await Promise.all([read("app.js"), read("terminal-engine.js")])).join("\n");
  assert.match(app, /terminal-wordmark/);
  assert.match(app, /Local portfolio archive/);
  assert.match(app, /what does Riz do/);
  assert.match(app, /Natural-language questions/);
  assert.doesNotMatch(app, /terminal-command-grid|data-terminal-command|Ask Rizvisions anything/);
});

test("Notes ships only real local-notebook controls", async () => {
  const app = await read("app.js");
  const notesRenderer = app.slice(app.indexOf("function renderNotes"), app.indexOf("function renderTerminal"));
  assert.match(app, /createStarterNotes/);
  assert.match(app, /data-notes-new/);
  assert.match(app, /data-notes-checklist/);
  assert.match(app, /data-note-unlock-form/);
  assert.doesNotMatch(notesRenderer, /Quick Notes|Search|Recently Deleted|Duplicate/);
});

test("admin placement recovery points to the placement migration", async () => {
  const admin = await read("admin/admin.js");
  assert.match(admin, /media_placements[\s\S]{0,300}migrate-v10\.5\.sql/);
});

test("admin preserves editable media location and video metadata", async () => {
  const [html, admin] = await Promise.all([read("admin/index.html"), read("admin/admin.js")]);
  for (const field of ["locationNameInput","latitudeInput","longitudeInput","frameRateInput","codecInput"]) {
    assert.match(html, new RegExp(`id=["']${field}["']`));
    assert.match(admin, new RegExp(field));
  }
  assert.match(admin, /metadata:\s*\{[\s\S]{0,500}locationName[\s\S]{0,500}frameRate/);
});
