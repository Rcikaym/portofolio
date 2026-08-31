"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileView } from "@/components/file-view";
import {
  HOME,
  childrenOf,
  profile,
  type FsEntry,
} from "@/lib/content";
import {
  complete,
  defaultOpen,
  parseCommand,
  type ShellAction,
} from "@/lib/shell";

type LogLine = {
  id: number;
  kind: "in" | "out" | "err" | "ok" | "dim";
  text: string;
};

function promptFor(cwd: string) {
  const short = cwd === HOME ? "~" : cwd.replace(`${HOME}`, "~");
  return `${profile.user}@${profile.host}:${short}`;
}

export function Workspace() {
  const [cwd, setCwd] = useState(HOME);
  const [openPath, setOpenPath] = useState(defaultOpen());
  const [treeOpen, setTreeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>(() => [
    {
      id: 0,
      kind: "dim",
      text: `login: ${profile.user}  pts/0  ${profile.location}`,
    },
    {
      id: 1,
      kind: "out",
      text: "type  help  ·  or open a file from the tree",
    },
  ]);
  const history = useRef<string[]>([]);
  const histIdx = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEnd = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);

  const push = useCallback((kind: LogLine["kind"], text: string) => {
    idRef.current += 1;
    setLog((prev) => [...prev, { id: idRef.current, kind, text }]);
  }, []);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [log]);

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
      push("err", "clipboard: permission denied — use mailto instead");
    }
  }, [push]);

  const applyActions = useCallback(
    (actions: ShellAction[]) => {
      for (const action of actions) {
        if (action.type === "clear") {
          setLog([]);
          continue;
        }
        if (action.type === "cwd") {
          setCwd(action.path);
          setOpenPath(action.path);
          setTreeOpen(false);
          action.lines?.forEach((line) => push("out", line));
          continue;
        }
        if (action.type === "open") {
          setOpenPath(action.path);
          setTreeOpen(false);
          action.lines?.forEach((line) => push("out", line));
          continue;
        }
        if (action.type === "href") {
          action.lines.forEach((line) => push("ok", line));
          window.open(action.url, "_blank", "noopener,noreferrer");
          continue;
        }
        const kind =
          action.tone === "err"
            ? "err"
            : action.tone === "ok"
              ? "ok"
              : action.tone === "dim"
                ? "dim"
                : "out";
        action.lines.forEach((line) => {
          if (line.startsWith("MAILTO=")) {
            void copyEmail(line.slice(7));
          }
          push(kind, line);
        });
      }
    },
    [copyEmail, push],
  );

  const openFile = useCallback(
    (raw: string) => {
      const result = parseCommand(
        raw.startsWith("cat ") || raw.startsWith("cd ") || raw.startsWith("open ")
          ? raw
          : `open ${raw}`,
        { cwd },
      );
      applyActions(result.actions);
    },
    [applyActions, cwd],
  );

  const run = useCallback(
    (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      push("in", `${promptFor(cwd)}$ ${trimmed}`);
      history.current = [trimmed, ...history.current.filter((h) => h !== trimmed)];
      histIdx.current = -1;
      const result = parseCommand(trimmed, { cwd });
      applyActions(result.actions);
      setInput("");
      setBusy(false);
      inputRef.current?.focus();
    },
    [applyActions, busy, cwd, push],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      run(input);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      setInput(complete(input, cwd));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(histIdx.current + 1, history.current.length - 1);
      if (next >= 0 && history.current[next]) {
        histIdx.current = next;
        setInput(history.current[next]);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = histIdx.current - 1;
      if (next < 0) {
        histIdx.current = -1;
        setInput("");
      } else {
        histIdx.current = next;
        setInput(history.current[next] ?? "");
      }
      return;
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLog([]);
    }
    if (event.key === "c" && event.ctrlKey) {
      event.preventDefault();
      setInput("");
      setBusy(false);
    }
  };

  useEffect(() => {
    const onSlash = (event: KeyboardEvent) => {
      if (event.key === "/" && event.target === document.body) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onSlash);
    return () => window.removeEventListener("keydown", onSlash);
  }, []);

  const tree = useMemo(() => {
    return { homeFiles: childrenOf(HOME) };
  }, []);

  const openName = openPath.split("/").pop() ?? openPath;
  const navFlags: { flag: string; target: string }[] = [
    { flag: "--readme", target: `${HOME}/README.md` },
    { flag: "--work", target: `${HOME}/experience.log` },
    { flag: "--code", target: `${HOME}/projects` },
    { flag: "--mail", target: `${HOME}/contact.sh` },
  ];

  return (
    <div className="shell">
      <a className="skip" href="#terminal">
        skip to prompt
      </a>
      <header className="nav-term">
        <p className="nav-term__line">
          <span className="prompt" aria-hidden="true">
            {">"}
          </span>{" "}
          <span className="wordmark">{profile.user}</span>{" "}
          {navFlags.map((item) => (
            <a
              key={item.flag}
              href={`#${item.flag.slice(2)}`}
              className={
                openPath === item.target || openPath.startsWith(`${item.target}/`)
                  ? "is-active"
                  : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                openFile(item.target);
              }}
            >
              {item.flag}
            </a>
          ))}
          <span className="caret" aria-hidden="true">
            ▮
          </span>
        </p>
        <Button
          type="button"
          variant="ghost"
          className="menu-toggle cmd"
          aria-expanded={treeOpen}
          aria-controls="file-tree"
          onClick={() => setTreeOpen((v) => !v)}
        >
          {treeOpen ? "[ close ]" : "[ ls ]"}
        </Button>
      </header>

      <div className="shell__body">
        <aside
          id="file-tree"
          className={treeOpen ? "tree is-open" : "tree"}
        >
          <p className="tree-label">{HOME}/</p>
          <ScrollArea className="tree-scroll">
            <nav aria-label="Home directory">
              <ul>
                {tree.homeFiles.map((entry) => (
                  <TreeRow
                    key={entry.path}
                    entry={entry}
                    openPath={openPath}
                    onOpen={openFile}
                  />
                ))}
              </ul>
              <p className="tree-label nested">projects/</p>
              <ul>
                {childrenOf(`${HOME}/projects`).map((entry) => (
                  <TreeRow
                    key={entry.path}
                    entry={entry}
                    openPath={openPath}
                    onOpen={openFile}
                  />
                ))}
              </ul>
            </nav>
          </ScrollArea>
        </aside>

        <section className="editor" aria-label="Open file">
          <p className="tab">
            <span className="tab-name">{openName}</span>
            <span className="dim">unix · utf-8 · {profile.handle}</span>
          </p>
          <ScrollArea className="editor-scroll">
            <FileView
              path={openPath}
              onOpen={openFile}
              onCopyEmail={() => void copyEmail()}
              copied={copied}
            />
          </ScrollArea>
        </section>
      </div>

      <section id="terminal" className="term" aria-label="Command prompt">
        <ScrollArea className="term-log">
          <div className="term-log__inner">
            {log.map((line) => (
              <p key={line.id} className={`log-${line.kind}`}>
                {line.text}
              </p>
            ))}
            <div ref={logEnd} />
          </div>
        </ScrollArea>
        <form
          className="term-line"
          onSubmit={(event) => {
            event.preventDefault();
            run(input);
          }}
        >
          <label className="sr-only" htmlFor="cmd">
            Command
          </label>
          <span className="prompt" aria-hidden="true">
            {promptFor(cwd)}$
          </span>
          <Input
            ref={inputRef}
            id="cmd"
            name="cmd"
            value={input}
            disabled={busy}
            data-state={busy ? "loading" : copyState === "error" ? "error" : undefined}
            placeholder="help"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="term-input"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </form>
      </section>

      <footer className="foot-dense">
        <p>
          {profile.fullName} · {profile.role}, {profile.location}. Public
          record from GitHub/{profile.handle}
          {"; "}
          LinkedIn did not render in this build so experience.log stays sourced.
          Typeface JetBrains Mono. No metrics invented. {new Date().getFullYear()}.
        </p>
      </footer>
    </div>
  );
}

function TreeRow({
  entry,
  openPath,
  onOpen,
}: {
  entry: FsEntry;
  openPath: string;
  onOpen: (path: string) => void;
}) {
  const current = openPath === entry.path;
  return (
    <li>
      <button
        type="button"
        className="tree-item"
        aria-current={current ? "true" : undefined}
        onClick={() => onOpen(entry.path)}
      >
        <span className="tree-kind" aria-hidden="true">
          {entry.kind === "dir" ? "d" : "-"}
        </span>
        {entry.name}
        {entry.kind === "dir" ? "/" : ""}
      </button>
    </li>
  );
}
