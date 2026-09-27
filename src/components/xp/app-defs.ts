/* Per-document app identity: which XP-era application a file opens in,
 * which icon represents it, and how its window is titled.
 * Single source of truth — desktop icons, window frames, taskbar and the
 * app renderer all derive from these helpers so identity stays consistent. */

import type { XpWindow } from "./xp-types";
import type { XpIconKey } from "./xp-icons";

export type DocKind = "wordpad" | "logview" | "shell";

export function docKindForPath(path: string): DocKind {
  const name = path.split("/").pop() ?? path;
  if (name.endsWith(".log")) return "logview";
  if (name.endsWith(".sh")) return "shell";
  return "wordpad";
}

/** Display name for XP chrome: XP never knew .md/.sh, so titles and
 *  labels show era-appropriate extensions. Real paths are untouched —
 *  this is presentational only. */
export function displayNameForPath(path: string): string {
  const name = path.split("/").pop() ?? path;
  if (name.endsWith(".md")) return name.slice(0, -3) + ".rtf";
  if (name.endsWith(".sh")) return name.slice(0, -3) + ".bat";
  return name;
}

/** Icon that represents the file type / application. */
export function docIconForPath(path: string): XpIconKey {
  const kind = docKindForPath(path);
  if (kind === "logview") return "log";
  if (kind === "shell") return "contact";
  return "document";
}

/** XP-era application name for the file type. */
export function docAppForPath(path: string): string {
  const kind = docKindForPath(path);
  if (kind === "logview") return "Log Viewer";
  if (kind === "shell") return "Contacts";
  return "WordPad";
}

/** Classic `file — App` window title (with display name). */
export function docTitleForPath(path: string): string {
  return `${displayNameForPath(path)} — ${docAppForPath(path)}`;
}

/** Icon for any open window (document windows resolve by file type). */
export function windowIconKey(win: XpWindow): XpIconKey {
  switch (win.app) {
    case "explorer":
      return "myComputer";
    case "terminal":
      return "terminal";
    case "editor":
      return "editor";
    case "iexplore":
      return "iexplore";
    case "camera":
      return "camera";
    case "notepad":
      return docIconForPath(win.path ?? "");
  }
}
