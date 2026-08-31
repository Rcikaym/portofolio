import assert from "node:assert/strict";
import { HOME, profile, projects } from "./content";
import {
  crumbs,
  excerptAround,
  headingAnchor,
  languageFor,
  nextTab,
  outlineFor,
  scmPublished,
  scmRemote,
  searchWorkspace,
  tabLabel,
} from "./ide";

assert.equal(languageFor(`${HOME}/README.md`), "Markdown");
assert.equal(languageFor(`${HOME}/contact.sh`), "Shell");
assert.equal(languageFor(`${HOME}/projects`), "Folder");
assert.equal(languageFor(`${HOME}/projects/applauncher.py`), "Python");

assert.equal(tabLabel(`${HOME}/about.md`), "about.md");
assert.deepEqual(
  crumbs(`${HOME}/projects/nimelist.md`).map((c) => c.label),
  ["fadlan", "projects", "nimelist.md"],
);

const hits = searchWorkspace("NimeList");
assert.ok(hits.some((h) => h.path.endsWith("nimelist.md")));
assert.ok(searchWorkspace("").length === 0);
assert.ok(excerptAround("hello world from fadlan", "world").includes("world"));

const remote = scmRemote();
assert.equal(remote.url, profile.github);
assert.equal(remote.since, profile.githubSince);
assert.equal(scmPublished().length, projects.length);
assert.ok(scmPublished().every((row) => row.url.startsWith("https://github.com/")));

assert.equal(headingAnchor("job", "Software engineer"), "job-software-engineer");
assert.ok(outlineFor(`${HOME}/experience.log`).some((row) => row.id === "job-software-engineer"));
assert.equal(nextTab(["a", "b", "c"], "b", "b"), "a");
assert.equal(nextTab(["a"], "a", "a"), `${HOME}/README.md`);

console.log("ide checks passed");
