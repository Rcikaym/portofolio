import assert from "node:assert/strict";
import { clampSplit, isTermToggleKey } from "./split";

assert.equal(clampSplit(10, 20, 100), 20);
assert.equal(clampSplit(200, 20, 100), 100);
assert.equal(clampSplit(50, 20, 100), 50);

const base = {
  altKey: false,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
};

assert.equal(
  isTermToggleKey({ ...base, code: "Backquote", ctrlKey: true }),
  true,
);
assert.equal(
  isTermToggleKey({ ...base, code: "Backquote", metaKey: true }),
  true,
);
assert.equal(isTermToggleKey({ ...base, code: "Backquote" }), false);
assert.equal(
  isTermToggleKey({ ...base, code: "KeyA", ctrlKey: true }),
  false,
);
assert.equal(
  isTermToggleKey({
    ...base,
    code: "Backquote",
    ctrlKey: true,
    shiftKey: true,
  }),
  false,
);

console.log("split checks passed");
