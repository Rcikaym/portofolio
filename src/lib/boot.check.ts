import assert from "node:assert/strict";
import {
  ASCII_BANNER,
  ASCII_PORTO,
  ASCII_RCIKAYM,
  BOOT_FETCHES,
  bootScript,
  bootSequenceMs,
  parseCssDuration,
} from "./boot";

for (const block of ASCII_BANNER) {
  const rows = block.art.split("\n");
  assert.equal(rows.length, 6);
  const width = rows[0]?.length ?? 0;
  assert.ok(width > 20);
  assert.ok(width <= 56, "each word must fit a phone without wrapping");
  assert.ok(rows.every((row) => row.length === width));
  assert.ok(block.art.includes("█"));
  assert.ok(block.art.includes("╔"));
}
assert.equal(new Set(ASCII_BANNER.map((b) => b.id)).size, ASCII_BANNER.length);
assert.equal(ASCII_BANNER[0]?.art, ASCII_RCIKAYM);
assert.equal(ASCII_BANNER[1]?.art, ASCII_PORTO);

const script = bootScript();
assert.equal(script[0]?.kind, "cmd");
assert.ok(script.some((s) => s.kind === "bar"));
assert.equal(script.filter((s) => s.kind === "fetch").length, BOOT_FETCHES.length);
assert.ok(
  script.some((s) => s.kind === "cmd" && s.command.includes("rcikaym-porto")),
);
assert.ok(
  script.some((s) => s.kind === "line" && s.text.includes("dependencies")),
);
assert.ok(
  script.some((s) => s.kind === "fetch" && s.pkg.includes("next@16.3.3")),
);
assert.ok(
  script.some((s) => s.kind === "line" && s.text.includes("README.md")),
);

assert.equal(parseCssDuration("120ms", 0), 120);
assert.equal(parseCssDuration("0.32s", 0), 320);
assert.equal(parseCssDuration("", 50), 50);
assert.equal(parseCssDuration("nope", 9), 9);

const sequenceMs = bootSequenceMs(script);
assert.ok(sequenceMs > 1000, "sequence should actually play");
assert.ok(sequenceMs < 20_000, "sequence must finish before the overlay failsafe");

console.log("boot checks passed");
