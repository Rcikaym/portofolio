"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileView } from "@/components/file-view";
import { FileTree } from "@/components/file-tree";
import { HOME, profile } from "@/lib/content";
import {
  complete,
  defaultOpen,
  parseCommand,
  type ShellAction,
} from "@/lib/shell";
import { BOOT_STORAGE_KEY } from "@/lib/boot";
import { BootGate, BootIntro } from "@/components/boot-intro";
import { clampSplit, isTermToggleKey } from "@/lib/split";

type LogLine = {
  id: number;
  kind: "in" | "out" | "err" | "ok" | "dim";
  text: string;
};

function promptFor(cwd: string) {
  const short = cwd === HOME ? "~" : cwd.replace(`${HOME}`, "~");
  return `${profile.user}@${profile.host}:${short}`;
}

export function Workspace({
  onChangeSession,
}: {
  onChangeSession?: () => void;
}) {
  const [cwd, setCwd] = useState(HOME);
  const [openPath, setOpenPath] = useState(defaultOpen());
  const [treeOpen, setTreeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [boot, setBoot] = useState<"unknown" | "on" | "off">("unknown");
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
  const shellRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLElement>(null);
  const termRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    axis: "x" | "y";
    start: number;
    size: number;
  } | null>(null);
  const idRef = useRef(2);
  const [treeW, setTreeW] = useState<number | null>(null);
  const [termH, setTermH] = useState<number | null>(null);
  const [termOpen, setTermOpen] = useState(true);
  const [splitting, setSplitting] = useState<"x" | "y" | null>(null);

  const push = useCallback((kind: LogLine["kind"], text: string) => {
    const id = ++idRef.current;
    setLog((prev) => [...prev, { id, kind, text }]);
  }, []);

  const pushLines = useCallback((kind: LogLine["kind"], lines: string[]) => {
    if (lines.length === 0) return;
    const items = lines.map((text) => ({
      id: ++idRef.current,
      kind,
      text,
    }));
    setLog((prev) => [...prev, ...items]);
  }, []);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [log]);

  useEffect(() => {
    try {
      const replay = new URLSearchParams(window.location.search).has("boot");
      if (replay) {
        sessionStorage.removeItem(BOOT_STORAGE_KEY);
        setBoot("on");
        return;
      }
      if (sessionStorage.getItem(BOOT_STORAGE_KEY) === "1") {
        setBoot("off");
        return;
      }
    } catch {
      /* private mode */
    }
    setBoot("on");
  }, []);

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    setBoot("off");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

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
          if (action.lines?.length) pushLines("out", action.lines);
          continue;
        }
        if (action.type === "open") {
          setOpenPath(action.path);
          setTreeOpen(false);
          if (action.lines?.length) pushLines("out", action.lines);
          continue;
        }
        if (action.type === "href") {
          pushLines("ok", action.lines);
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
        const mail = action.lines.find((line) => line.startsWith("MAILTO="));
        if (mail) void copyEmail(mail.slice(7));
        pushLines(kind, action.lines);
      }
    },
    [copyEmail, pushLines],
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

  const toggleTerm = useCallback((open?: boolean) => {
    setTermOpen((prev) => {
      const next = open ?? !prev;
      if (next) window.setTimeout(() => inputRef.current?.focus(), 0);
      return next;
    });
  }, []);

  useEffect(() => {
    if (boot !== "off") return;
    const onKey = (event: KeyboardEvent) => {
      if (!isTermToggleKey(event)) return;
      event.preventDefault();
      toggleTerm();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [boot, toggleTerm]);

  const onSplitDown = (
    axis: "x" | "y",
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const node = axis === "x" ? treeRef.current : termRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const size = axis === "x" ? box.width : box.height;
    dragRef.current = {
      axis,
      start: axis === "x" ? event.clientX : event.clientY,
      size,
    };
    if (axis === "x") setTreeW(size);
    else {
      setTermH(size);
      setTermOpen(true);
    }
    setSplitting(axis);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onSplitMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const shell = shellRef.current?.getBoundingClientRect();
    if (drag.axis === "x") {
      const max = shell ? Math.min(shell.width * 0.5, 28 * 16) : 448;
      setTreeW(
        clampSplit(drag.size + (event.clientX - drag.start), 10 * 16, max),
      );
      return;
    }
    const max = shell ? Math.max(8 * 16, shell.height * 0.7) : 420;
    const next = drag.size - (event.clientY - drag.start);
    if (next < 4.5 * 16) {
      setTermOpen(false);
      dragRef.current = null;
      setSplitting(null);
      return;
    }
    setTermOpen(true);
    setTermH(clampSplit(next, 8 * 16, max));
  };

  const onSplitUp = () => {
    dragRef.current = null;
    setSplitting(null);
  };

  const shellStyle: CSSProperties = {};
  if (treeW != null) {
    shellStyle["--tree-width" as string] = `${treeW}px`;
  }
  if (!termOpen) {
    shellStyle["--term-height" as string] = "0px";
  } else if (termH != null) {
    shellStyle["--term-height" as string] = `${termH}px`;
  }

  const openName = openPath.split("/").pop() ?? openPath;
  const navFlags: { flag: string; target: string }[] = [
    { flag: "--readme", target: `${HOME}/README.md` },
    { flag: "--work", target: `${HOME}/experience.log` },
    { flag: "--code", target: `${HOME}/projects` },
    { flag: "--mail", target: `${HOME}/contact.sh` },
  ];

  const booting = boot !== "off";

  return (
    <>
      {boot === "on" ? <BootIntro onDone={finishBoot} /> : null}
      {boot === "unknown" ? <BootGate /> : null}
    <div
      ref={shellRef}
      className="shell"
      data-term={termOpen ? "on" : "off"}
      data-split={splitting ?? undefined}
      style={shellStyle}
      {...(booting ? { inert: true } : {})}
    >
      <a
        className="skip"
        href="#terminal"
        onClick={() => toggleTerm(true)}
      >
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
        <div className="nav-term__actions">
          {onChangeSession ? (
            <Button
              type="button"
              variant="ghost"
              className="cmd"
              onClick={onChangeSession}
            >
              [ session ]
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="cmd term-toggle"
            aria-pressed={termOpen}
            aria-controls="terminal"
            aria-keyshortcuts="Control+` Meta+`"
            onClick={() => toggleTerm()}
          >
            [ term ]
          </Button>
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
        </div>
      </header>

      <div className="shell__body">
        <aside
          ref={treeRef}
          id="file-tree"
          className={treeOpen ? "tree is-open" : "tree"}
        >
          <p className="tree-label">{HOME}/</p>
          <ScrollArea className="tree-scroll">
            <FileTree openPath={openPath} onOpen={openFile} />
          </ScrollArea>
          <Split
            axis="x"
            label="Resize file tree"
            onPointerDown={(event) => onSplitDown("x", event)}
            onPointerMove={onSplitMove}
            onPointerUp={onSplitUp}
            onReset={() => setTreeW(null)}
          />
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

      <section
        ref={termRef}
        id="terminal"
        className="term"
        aria-label="Command prompt"
        aria-hidden={!termOpen}
        {...(!termOpen ? { inert: true } : {})}
      >
        <Split
          axis="y"
          label="Resize terminal"
          onPointerDown={(event) => onSplitDown("y", event)}
          onPointerMove={onSplitMove}
          onPointerUp={onSplitUp}
          onReset={() => setTermH(null)}
        />
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
          {profile.fullName} · {profile.role}, {profile.location}. GitHub/
          {profile.handle}. Typeface JetBrains Mono. {new Date().getFullYear()}.
        </p>
      </footer>
    </div>
    </>
  );
}

function Split({
  axis,
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onReset,
}: {
  axis: "x" | "y";
  label: string;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onReset: () => void;
}) {
  return (
    <button
      type="button"
      className={`split split--${axis}`}
      aria-label={label}
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      onDoubleClick={(event) => {
        event.preventDefault();
        onReset();
      }}
    />
  );
}

