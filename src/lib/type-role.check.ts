import assert from "node:assert/strict";
import {
  HELLO_ROLES,
  TYPE_MS,
  isFullWord,
  longestRole,
  startState,
  typeStep,
  typedText,
  type TypeState,
} from "./type-role";

assert.equal(HELLO_ROLES[0], "Fadlan");
assert.ok(HELLO_ROLES.includes("Junior Software Engineer"));
assert.ok(HELLO_ROLES.includes("Tech Enthusiast"));
assert.equal(longestRole(), "Junior Software Engineer");
assert.ok(
  HELLO_ROLES.every((role) => role.length <= longestRole().length),
);

const start = startState();
assert.equal(typedText(start), "Fadlan");
assert.equal(start.phase, "type");
assert.ok(isFullWord(start));

const afterHold = typeStep(start);
assert.equal(afterHold.next.phase, "delete");
assert.equal(afterHold.wait, TYPE_MS.holdName);
assert.equal(typedText(afterHold.next), "Fadlan");

let s: TypeState = afterHold.next;
while (s.n > 0) {
  const step = typeStep(s);
  assert.ok(step.wait === TYPE_MS.delete);
  assert.equal(step.next.n, s.n - 1);
  s = step.next;
}
assert.equal(typedText(s), "");

const wrap = typeStep(s);
assert.equal(wrap.next.i, 1);
assert.equal(wrap.next.n, 0);
assert.equal(wrap.next.phase, "type");
assert.equal(wrap.wait, TYPE_MS.pause);

s = wrap.next;
for (let n = 0; n < 200; n++) {
  if (isFullWord(s) && s.phase === "type") break;
  s = typeStep(s).next;
}
assert.equal(typedText(s), "Junior Software Engineer");
assert.equal(typeStep(s).wait, TYPE_MS.hold);

const seen = new Set<string>();
s = startState();
for (let n = 0; n < 400; n++) {
  if (isFullWord(s) && s.phase === "type") seen.add(typedText(s));
  s = typeStep(s).next;
}
assert.deepEqual([...seen], [...HELLO_ROLES]);

s = { i: HELLO_ROLES.length - 1, n: 0, phase: "delete" };
assert.equal(typeStep(s).next.i, 0);

console.log("type-role checks passed");
