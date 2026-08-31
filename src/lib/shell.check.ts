import assert from "node:assert/strict";
import { parseCommand, splitArgs, complete } from "./shell";
import { HOME, profile } from "./content";

assert.equal(`${profile.user}@${profile.host}`, "fadlan@rcikaym");

const cwd = { cwd: HOME };

{
  const r = parseCommand("help", cwd);
  assert.equal(r.actions[0]?.type, "print");
  assert.ok(
    r.actions[0]?.type === "print" &&
      r.actions[0].lines.some((l) => l.includes("COMMANDS")),
  );
}

{
  const r = parseCommand("cat about.md", cwd);
  assert.equal(r.actions[0]?.type, "open");
  assert.ok(r.actions[0]?.type === "open" && r.actions[0].path.endsWith("about.md"));
}

{
  const r = parseCommand("cat no-such-file", cwd);
  assert.ok(r.error);
  assert.equal(r.actions[0]?.type, "print");
  assert.ok(r.actions[0]?.type === "print" && r.actions[0].tone === "err");
}

{
  const r = parseCommand("ls", cwd);
  assert.equal(r.actions[0]?.type, "print");
  assert.ok(
    r.actions[0]?.type === "print" &&
      r.actions[0].lines.includes("README.md") &&
      r.actions[0].lines.includes("projects/"),
  );
}

{
  const r = parseCommand("cd projects", cwd);
  assert.equal(r.actions[0]?.type, "cwd");
  assert.ok(r.actions[0]?.type === "cwd" && r.actions[0].path.endsWith("/projects"));
}

{
  const r = parseCommand("xyzzy", cwd);
  assert.ok(r.error?.includes("xyzzy"));
}

{
  const r = parseCommand("open github", cwd);
  assert.equal(r.actions[0]?.type, "href");
  assert.ok(
    r.actions[0]?.type === "href" &&
      r.actions[0].url.includes("github.com/Rcikaym"),
  );
}

{
  assert.deepEqual(splitArgs(`cat "about.md"`), ["cat", "about.md"]);
  assert.equal(complete("he", HOME), "help ");
  assert.equal(complete("cat READ", HOME), "cat README.md ");
}

console.log("shell checks passed");
