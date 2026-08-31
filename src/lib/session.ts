export const SESSION_STORAGE_KEY = "rcikaym-session";

export type SessionId = "unix" | "ide";
export type SessionView = "chooser" | SessionId;
export type ThemeAttr = "chooser" | "terminal" | "ide";

export function parseSessionParam(raw: string | null | undefined): SessionView | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "unix" || v === "terminal" || v === "tty") return "unix";
  if (v === "ide" || v === "editor") return "ide";
  if (v === "chooser" || v === "welcome" || v === "session") return "chooser";
  return null;
}

export function themeAttr(view: SessionView): ThemeAttr {
  if (view === "unix") return "terminal";
  if (view === "ide") return "ide";
  return "chooser";
}

export function resolveSessionView(
  search: string,
  stored: SessionId | null,
): SessionView {
  const q = new URLSearchParams(search);
  const fromQuery = parseSessionParam(q.get("theme") ?? q.get("session"));
  if (fromQuery) return fromQuery;
  if (stored) return stored;
  return "chooser";
}

export function readStoredSession(): SessionId | null {
  try {
    const v = localStorage.getItem(SESSION_STORAGE_KEY);
    if (v === "unix" || v === "ide") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeStoredSession(id: SessionId): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

export function applyDocumentTheme(view: SessionView): void {
  document.documentElement.dataset.theme = themeAttr(view);
}

/** Runs before paint. Keep in sync with parseSessionParam / resolveSessionView. */
export const THEME_BOOT_SCRIPT = `(function(){
  try {
    var q = new URLSearchParams(location.search);
    var raw = q.get("theme") || q.get("session");
    var v = raw ? String(raw).toLowerCase().trim() : "";
    var view = null;
    if (v === "unix" || v === "terminal" || v === "tty") view = "unix";
    else if (v === "ide" || v === "editor") view = "ide";
    else if (v === "chooser" || v === "welcome" || v === "session") view = "chooser";
    if (!view) {
      var s = localStorage.getItem("rcikaym-session");
      if (s === "unix" || s === "ide") view = s;
      else view = "chooser";
    }
    var theme = view === "unix" ? "terminal" : view === "ide" ? "ide" : "chooser";
    document.documentElement.setAttribute("data-theme", theme);
    if (view === "unix" || view === "ide") {
      try { localStorage.setItem("rcikaym-session", view); } catch (e) {}
    }
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "chooser");
  }
})();`;
