"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Files,
  GitBranch,
  ListTree,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTree } from "@/components/file-tree";
import { FileView } from "@/components/file-view";
import { HOME, fsEntries, profile } from "@/lib/content";
import {
  crumbs,
  languageFor,
  nextTab,
  outlineFor,
  panelTitle,
  scmPublished,
  scmRemote,
  searchWorkspace,
  tabLabel,
  type IdePanel,
} from "@/lib/ide";
import { defaultOpen, parseCommand, type ShellAction } from "@/lib/shell";

type CopyState = "idle" | "loading" | "error" | "success";
type MenuId = "file" | "view" | "go" | "help" | null;
type PaletteKind = "file" | "command";
type PaletteRow = {
  kind: PaletteKind;
  id: string;
  label: string;
  hint: string;
  run: () => void;
};

const PANEL_ICONS: Record<IdePanel, typeof Files> = {
  files: Files,
  search: Search,
  git: GitBranch,
  outline: ListTree,
};

export function IdeWorkspace({
  onChangeSession,
}: {
  onChangeSession?: () => void;
}) {
  const [cwd, setCwd] = useState(HOME);
  const [openPath, setOpenPath] = useState(defaultOpen());
  const [tabs, setTabs] = useState<string[]>(() => [defaultOpen()]);
  const [panel, setPanel] = useState<IdePanel>("files");
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(max-width: 39.99rem)").matches,
  );
  const [menu, setMenu] = useState<MenuId>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [jumpId, setJumpId] = useState<string | null>(null);
  const paletteRef = useRef<HTMLDialogElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchFieldId = useId();

  const copyEmail = useCallback(async (email: string = profile.email) => {
    setCopyState("loading");
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setCopyState("success");
      window.setTimeout(() => {
        setCopied(false);
        setCopyState("idle");
      }, 2500);
    } catch {
      setCopyState("error");
    }
  }, []);

  const openFile = useCallback(
    (raw: string) => {
      const result = parseCommand(
        raw.startsWith("cat ") ||
          raw.startsWith("cd ") ||
          raw.startsWith("open ")
          ? raw
          : `open ${raw}`,
        { cwd },
      );
      for (const action of result.actions as ShellAction[]) {
        if (action.type === "cwd") {
          setCwd(action.path);
          setOpenPath(action.path);
          setTabs((prev) =>
            prev.includes(action.path) ? prev : [...prev, action.path],
          );
          if (window.matchMedia("(max-width: 39.99rem)").matches) {
            setSidebarOpen(false);
          }
          continue;
        }
        if (action.type === "open") {
          setOpenPath(action.path);
          setTabs((prev) =>
            prev.includes(action.path) ? prev : [...prev, action.path],
          );
          if (window.matchMedia("(max-width: 39.99rem)").matches) {
            setSidebarOpen(false);
          }
          continue;
        }
        if (action.type === "href") {
          window.open(action.url, "_blank", "noopener,noreferrer");
          continue;
        }
        if (action.type === "print") {
          const mail = action.lines.find((line) => line.startsWith("MAILTO="));
          if (mail) void copyEmail(mail.slice(7));
        }
      }
    },
    [copyEmail, cwd],
  );

  const closeTab = useCallback(
    (path: string) => {
      setTabs((prev) => {
        const nextPath = nextTab(prev, path, openPath);
        const remain = prev.filter((tab) => tab !== path);
        const next = remain.length === 0 ? [nextPath] : remain;
        setOpenPath(nextPath);
        return next;
      });
    },
    [openPath],
  );

  const pickPanel = useCallback((id: IdePanel) => {
    if (id === panel) {
      setSidebarOpen((open) => !open);
    } else {
      setPanel(id);
      setSidebarOpen(true);
    }
    if (id === "search") {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [panel]);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    setQuery("");
    setActive(0);
    paletteRef.current?.close();
  }, []);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    setMenu(null);
    setActive(0);
    const node = paletteRef.current;
    if (node && !node.open) node.showModal();
    window.setTimeout(() => paletteInputRef.current?.focus(), 0);
  }, []);

  const jumpOutline = useCallback(
    (id: string) => {
      if (id.startsWith("~")) {
        openFile(id);
        return;
      }
      setJumpId(id);
    },
    [openFile],
  );

  useEffect(() => {
    if (!jumpId) return;
    const node = document.getElementById(jumpId);
    node?.scrollIntoView({ block: "start" });
    setJumpId(null);
  }, [jumpId, openPath]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (paletteOpen) closePalette();
        else openPalette();
        return;
      }
      if (meta && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (paletteOpen) closePalette();
        else openPalette();
        return;
      }
      if (meta && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarOpen((open) => !open);
        return;
      }
      if (event.key === "Escape") {
        setMenu(null);
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePalette, openPalette, paletteOpen]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: PointerEvent) => {
      if (!titleRef.current?.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [menu]);

  const commands = useMemo<PaletteRow[]>(() => {
    const files: PaletteRow[] = fsEntries
      .filter((entry) => entry.kind === "file")
      .map((entry) => ({
        kind: "file" as const,
        id: entry.path,
        label: entry.name,
        hint: entry.path.replace(HOME, "~"),
        run: () => {
          openFile(entry.path);
          closePalette();
        },
      }));
    const cmds: PaletteRow[] = [
      {
        kind: "command",
        id: "cmd-explorer",
        label: "Explorer",
        hint: "View",
        run: () => {
          pickPanel("files");
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-search",
        label: "Search",
        hint: "View",
        run: () => {
          pickPanel("search");
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-git",
        label: "Source Control",
        hint: "View",
        run: () => {
          pickPanel("git");
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-outline",
        label: "Outline",
        hint: "View",
        run: () => {
          pickPanel("outline");
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-mail",
        label: "Copy email",
        hint: profile.email,
        run: () => {
          void copyEmail();
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-github",
        label: "Open GitHub",
        hint: "Rcikaym",
        run: () => {
          window.open(profile.github, "_blank", "noopener,noreferrer");
          closePalette();
        },
      },
      {
        kind: "command",
        id: "cmd-contact",
        label: "Open contact.sh",
        hint: "Go",
        run: () => {
          openFile(`${HOME}/contact.sh`);
          closePalette();
        },
      },
    ];
    if (onChangeSession) {
      cmds.push({
        kind: "command",
        id: "cmd-session",
        label: "Sessions",
        hint: "Unix or Editor",
        run: () => {
          onChangeSession();
          closePalette();
        },
      });
    }
    return [...files, ...cmds];
  }, [closePalette, copyEmail, onChangeSession, openFile, pickPanel]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (row) =>
        row.label.toLowerCase().includes(q) ||
        row.hint.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!paletteOpen) return;
    document.getElementById(`ide-pal-${active}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [active, paletteOpen]);

  const searchHits = useMemo(() => searchWorkspace(searchQ), [searchQ]);
  const outline = useMemo(() => outlineFor(openPath), [openPath]);
  const trail = useMemo(() => crumbs(openPath), [openPath]);
  const remote = scmRemote();
  const published = scmPublished();
  const lang = languageFor(openPath);
  const openName = tabLabel(openPath);

  const runMenu = (fn: () => void) => {
    fn();
    setMenu(null);
  };

  return (
    <div
      className={
        sidebarOpen ? "ide" : "ide ide--side-off"
      }
    >
      <a className="skip" href="#ide-editor">
        skip to editor
      </a>

      <header className="ide-title" ref={titleRef}>
        <nav className="ide-menubar" aria-label="Editor">
          <Menu
            id="file"
            label="File"
            open={menu}
            setOpen={setMenu}
          >
            <MenuItem
              label="Open file"
              kbd="⌘K"
              onClick={() => runMenu(openPalette)}
            />
            <MenuItem
              label={copied ? "Copied email" : "Copy email"}
              onClick={() => runMenu(() => void copyEmail())}
            />
            <MenuItem
              label="Close tab"
              onClick={() => runMenu(() => closeTab(openPath))}
            />
            {onChangeSession ? (
              <MenuItem
                label="Sessions"
                onClick={() => runMenu(onChangeSession)}
              />
            ) : null}
          </Menu>
          <Menu id="view" label="View" open={menu} setOpen={setMenu}>
            <MenuItem
              label="Explorer"
              onClick={() => runMenu(() => pickPanel("files"))}
            />
            <MenuItem
              label="Search"
              onClick={() => runMenu(() => pickPanel("search"))}
            />
            <MenuItem
              label="Source Control"
              onClick={() => runMenu(() => pickPanel("git"))}
            />
            <MenuItem
              label="Outline"
              onClick={() => runMenu(() => pickPanel("outline"))}
            />
            <MenuItem
              label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              kbd="⌘B"
              onClick={() => runMenu(() => setSidebarOpen((v) => !v))}
            />
          </Menu>
          <Menu id="go" label="Go" open={menu} setOpen={setMenu}>
            <MenuItem
              label="README.md"
              onClick={() => runMenu(() => openFile(`${HOME}/README.md`))}
            />
            <MenuItem
              label="about.md"
              onClick={() => runMenu(() => openFile(`${HOME}/about.md`))}
            />
            <MenuItem
              label="contact.sh"
              onClick={() => runMenu(() => openFile(`${HOME}/contact.sh`))}
            />
            <MenuItem
              label="GitHub"
              onClick={() =>
                runMenu(() =>
                  window.open(profile.github, "_blank", "noopener,noreferrer"),
                )
              }
            />
          </Menu>
          <Menu id="help" label="Help" open={menu} setOpen={setMenu}>
            <MenuItem
              label="Keyboard"
              onClick={() => runMenu(() => setHelpOpen(true))}
            />
          </Menu>
        </nav>
        {onChangeSession ? (
          <button
            type="button"
            className="ide-title__session"
            onClick={onChangeSession}
          >
            Sessions
          </button>
        ) : (
          <span className="ide-title__session" />
        )}
        <p className="ide-title__project">{profile.user}</p>
        <button
          type="button"
          className="ide-title__go"
          aria-label="Open file"
          aria-expanded={paletteOpen}
          onClick={() => (paletteOpen ? closePalette() : openPalette())}
        >
          <span>Open</span>
          <kbd>⌘K</kbd>
        </button>
      </header>

      <nav className="ide-rail" aria-label="Activity">
        {(["files", "search", "git", "outline"] as const).map((id) => {
          const Icon = PANEL_ICONS[id];
          const on = sidebarOpen && panel === id;
          return (
            <button
              key={id}
              type="button"
              className="ide-rail__btn"
              aria-label={panelTitle(id)}
              aria-pressed={on}
              aria-controls="ide-side"
              onClick={() => pickPanel(id)}
            >
              <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      {sidebarOpen ? (
        <aside id="ide-side" className="ide-side" aria-label={panelTitle(panel)}>
          <p className="ide-side__title">{panelTitle(panel)}</p>
          {panel === "files" ? (
            <ScrollArea className="tree-scroll">
              <FileTree openPath={openPath} onOpen={openFile} skin="ide" />
            </ScrollArea>
          ) : null}
          {panel === "search" ? (
            <div className="ide-side__body">
              <label className="sr-only" htmlFor={searchFieldId}>
                Search this workspace
              </label>
              <Input
                ref={searchRef}
                id={searchFieldId}
                value={searchQ}
                placeholder="Search ~/fadlan"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="ide-side__input"
                onChange={(event) => setSearchQ(event.target.value)}
              />
              <ScrollArea className="tree-scroll">
                {searchQ.trim() === "" ? (
                  <p className="ide-empty">Type to search files in this workspace.</p>
                ) : searchHits.length === 0 ? (
                  <p className="ide-empty">
                    No match for that query. Try a name, a stack, or a place.
                  </p>
                ) : (
                  <ul className="ide-hitlist">
                    {searchHits.map((hit) => (
                      <li key={hit.path}>
                        <button
                          type="button"
                          className="ide-hit"
                          onClick={() => openFile(hit.path)}
                        >
                          <span>{hit.name}</span>
                          <span className="dim">{hit.excerpt}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
          ) : null}
          {panel === "git" ? (
            <ScrollArea className="tree-scroll">
              <div className="ide-git">
                <p className="ide-git__remote">
                  <a href={remote.url} target="_blank" rel="noreferrer">
                    {remote.host}
                  </a>
                  <span className="dim">on GitHub since {remote.since}</span>
                </p>
                <p className="ide-empty">
                  This workspace is a read of the public record — not a live
                  working tree. No invented diffs.
                </p>
                <p className="ide-side__label">Published</p>
                <ul className="ide-hitlist">
                  {published.map((repo) => (
                    <li key={repo.url}>
                      <div className="ide-scm">
                        <button
                          type="button"
                          className="ide-hit"
                          onClick={() => openFile(repo.path)}
                        >
                          <span>{repo.name}</span>
                          <span className="dim">{repo.language}</span>
                        </button>
                        <a
                          className="ide-scm__ext"
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          ) : null}
          {panel === "outline" ? (
            <ScrollArea className="tree-scroll">
              {outline.length === 0 ? (
                <p className="ide-empty">Nothing to outline in this buffer.</p>
              ) : (
                <ul className="ide-hitlist">
                  {outline.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="ide-hit"
                        onClick={() => jumpOutline(row.id)}
                      >
                        {row.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          ) : null}
        </aside>
      ) : null}

      {sidebarOpen ? (
        <button
          type="button"
          className="ide-scrim"
          aria-label="Hide sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="ide-stage">
        <div className="ide-tabs" role="tablist" aria-label="Open editors">
          {tabs.map((path) => {
            const selected = path === openPath;
            return (
              <div
                key={path}
                className={selected ? "ide-tab is-on" : "ide-tab"}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className="ide-tab__btn"
                  onClick={() => setOpenPath(path)}
                >
                  {tabLabel(path)}
                </button>
                <button
                  type="button"
                  className="ide-tab__close"
                  aria-label={`Close ${tabLabel(path)}`}
                  onClick={() => closeTab(path)}
                >
                  <X size={12} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <nav className="ide-crumbs" aria-label="Path">
          {trail.map((crumb, i) => (
            <span key={crumb.path}>
              {i > 0 ? <span className="ide-crumbs__sep">/</span> : null}
              <button
                type="button"
                className="ide-crumbs__btn"
                onClick={() => openFile(crumb.path)}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </nav>
        <section id="ide-editor" className="ide-canvas" aria-label={openName}>
          <ScrollArea className="editor-scroll">
            <FileView
              path={openPath}
              skin="ide"
              onOpen={openFile}
              onCopyEmail={() => void copyEmail()}
              copied={copied}
            />
          </ScrollArea>
        </section>
      </div>

      <footer className="ide-status">
        <p>
          <a href={remote.url} target="_blank" rel="noreferrer">
            {remote.host}
          </a>
        </p>
        <p>{openPath.replace(HOME, "~")}</p>
        <p>
          utf-8
          <span className="ide-status__dot" aria-hidden="true">
            ·
          </span>
          {lang}
          <span className="ide-status__dot" aria-hidden="true">
            ·
          </span>
          {profile.location}
          {copyState === "error" ? (
            <>
              <span className="ide-status__dot" aria-hidden="true">
                ·
              </span>
              clipboard blocked
            </>
          ) : null}
        </p>
      </footer>

      {helpOpen ? (
        <dialog
          className="ide-cmdk"
          open
          aria-labelledby="ide-help-title"
          onClose={() => setHelpOpen(false)}
          onClick={(event) => {
            if (event.currentTarget === event.target) setHelpOpen(false);
          }}
        >
          <h2 id="ide-help-title">Keyboard</h2>
          <ul className="ide-help">
            <li>
              <kbd>⌘K</kbd> / <kbd>⌘P</kbd> go to file
            </li>
            <li>
              <kbd>⌘B</kbd> sidebar
            </li>
            <li>
              <kbd>esc</kbd> close
            </li>
          </ul>
          <button
            type="button"
            className="ide-cmdk__dismiss"
            onClick={() => setHelpOpen(false)}
          >
            Close
          </button>
        </dialog>
      ) : null}

      <dialog
        ref={paletteRef}
        className="ide-cmdk"
        aria-labelledby="ide-cmdk-title"
        onClose={closePalette}
        onClick={(event) => {
          if (event.target === paletteRef.current) closePalette();
        }}
      >
        <h2 id="ide-cmdk-title" className="sr-only">
          Go to file
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            filtered[active]?.run();
          }}
        >
          <label className="sr-only" htmlFor="ide-go">
            Filter files and commands
          </label>
          <Input
            ref={paletteInputRef}
            id="ide-go"
            name="go"
            value={query}
            placeholder="Go to file"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="ide-cmdk__input"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="ide-cmdk-results"
            aria-activedescendant={
              filtered[active] ? `ide-pal-${active}` : undefined
            }
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closePalette();
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (filtered.length === 0) return;
                setActive((i) => (i + 1) % filtered.length);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                if (filtered.length === 0) return;
                setActive((i) => (i - 1 + filtered.length) % filtered.length);
              }
            }}
          />
        </form>
        <ScrollArea className="ide-cmdk__list">
          {filtered.length === 0 ? (
            <p className="dim ide-cmdk__empty">Nothing matches that filter.</p>
          ) : (
            <ul id="ide-cmdk-results" role="listbox">
              {filtered.map((row, index) => (
                <li key={row.id}>
                  <button
                    type="button"
                    id={`ide-pal-${index}`}
                    role="option"
                    className="ide-cmdk__row"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={row.run}
                  >
                    {row.label}
                    <span className="dim">{row.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <p className="ide-cmdk__hint">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </p>
        <p className="sr-only" aria-live="polite">
          {filtered.length === 0 ? "No results" : `${filtered.length} results`}
        </p>
      </dialog>
    </div>
  );
}

function Menu({
  id,
  label,
  open,
  setOpen,
  children,
}: {
  id: Exclude<MenuId, null>;
  label: string;
  open: MenuId;
  setOpen: (id: MenuId) => void;
  children: ReactNode;
}) {
  const shown = open === id;
  return (
    <div className="ide-menu">
      <button
        type="button"
        className="ide-menu__btn"
        aria-expanded={shown}
        aria-haspopup="menu"
        onClick={() => setOpen(shown ? null : id)}
      >
        {label}
      </button>
      {shown ? (
        <div className="ide-menu__list" role="menu">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  kbd,
  onClick,
}: {
  label: string;
  kbd?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" role="menuitem" className="ide-menu__item" onClick={onClick}>
      <span>{label}</span>
      {kbd ? <kbd>{kbd}</kbd> : null}
    </button>
  );
}
