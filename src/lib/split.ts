export function clampSplit(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** VS Code panel toggle: Ctrl-` on Windows/Linux, Ctrl-` or Cmd-` on Mac. */
export function isTermToggleKey(event: {
  code: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}): boolean {
  if (event.code !== "Backquote") return false;
  if (event.altKey || event.shiftKey) return false;
  return event.ctrlKey || event.metaKey;
}
