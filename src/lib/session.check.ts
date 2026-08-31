import assert from "node:assert/strict";
import {
  parseSessionParam,
  resolveSessionView,
  themeAttr,
} from "./session";

assert.equal(parseSessionParam("unix"), "unix");
assert.equal(parseSessionParam("TTY"), "unix");
assert.equal(parseSessionParam("terminal"), "unix");
assert.equal(parseSessionParam("ide"), "ide");
assert.equal(parseSessionParam("editor"), "ide");
assert.equal(parseSessionParam("welcome"), "chooser");
assert.equal(parseSessionParam("nope"), null);
assert.equal(parseSessionParam(""), null);

assert.equal(themeAttr("unix"), "terminal");
assert.equal(themeAttr("ide"), "ide");
assert.equal(themeAttr("chooser"), "chooser");

assert.equal(resolveSessionView("?theme=ide", "unix"), "ide");
assert.equal(resolveSessionView("?session=tty", null), "unix");
assert.equal(resolveSessionView("", "ide"), "ide");
assert.equal(resolveSessionView("", null), "chooser");
assert.equal(resolveSessionView("?theme=chooser", "unix"), "chooser");

console.log("session checks passed");
