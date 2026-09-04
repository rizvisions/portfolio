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

test("public version labels agree on V10.7", async () => {
  const [readme, app] = await Promise.all([read("README.md"), read("app.js")]);
  assert.match(readme, /V10\.7\.0/);
  assert.match(app, /Rizvisions OS 10\.7\.0/);
  assert.match(app, /Version 10\.7/);
});

test("admin placement recovery points to the placement migration", async () => {
  const admin = await read("admin/admin.js");
  assert.match(admin, /media_placements[\s\S]{0,300}migrate-v10\.5\.sql/);
});

