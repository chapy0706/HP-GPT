// /tests/offline-contract.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { checkOfflineContracts } from "../scripts/offline-contract.mjs";

test("offline contracts: should have no failures", () => {
  const failures = checkOfflineContracts({ rootDir: process.cwd() });
  assert.deepEqual(failures, []);
});
