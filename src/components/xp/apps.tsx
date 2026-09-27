"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTree } from "@/components/file-tree";
import { FileView } from "@/components/file-view";
import { HOME, profile, projects } from "@/lib/content";
import {
  complete,
  parseCommand,
  type ShellAction,
} from "@/lib/shell";
import { xpIcon } from "./xp-icons";
import { displayNameForPath } from "./app-defs";

/* ---------- shared: copy-email hook ---------- */
export function useCopyEmail() {
  const [copied, setCopied] = useState(false);
  const copyEmail = useCallback(async (email: string = profile.email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }, []);
  return { copied, copyEmail };
}

/* ---------- WordPad: rich document viewer (reuses FileView) ---------- */
export function WordPadApp({ path }: { path: string }) {
  return (
    <div className="xp-wordpad">
      <div className="xp-wordpad__ruler" aria-hidden="true" />
      <ScrollArea className="xp-wordpad__scroll">
        <div className="xp-wordpad__page">
          <FileView
            path={path}
            skin="ide"
            onOpen={() => {}}
            onCopyEmail={() => {}}
            copied={false}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

/* ---------- Log Viewer: monospace log skin + working filter ---------- */
export function LogViewApp({ path }: { path: string }) {
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState<{ shown: number; total: number }>({
    shown: 0,
    total: 0,
  });
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const q = query.trim().toLowerCase();
    const items = Array.from(root.querySelectorAll("li"));
    let shown = 0;
    for (const li of items) {
      const hit = !q || (li.textContent ?? "").toLowerCase().includes(q);
      (li as HTMLElement).style.display = hit ? "" : "none";
      if (hit) shown += 1;
    }
    setMatch({ shown, total: items.length });
  }, [query, path]);

  return (
    <div className="xp-logview">
      <div className="xp-logview__bar">
        <span className="xp-logview__file">{displayNameForPath(path)}</span>
        <span className="xp-logview__count" aria-live="polite">
          {query.trim()
            ? `${match.shown} of ${match.total} records`
            : `${match.total} records · read-only`}
        </span>
        <label className="sr-only" htmlFor="xp-log-filter">
          Filter log records
        </label>
        <input
          id="xp-log-filter"
          className="xp-logview__filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <ScrollArea className="xp-logview__scroll">
        <div ref={bodyRef} className="xp-logview__body">
          <FileView
            path={path}
            skin="ide"
            onOpen={() => {}}
            onCopyEmail={() => {}}
            copied={false}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

/* ---------- Contacts: address-book card + contact.bat console strip ----------
 * Phone icon, Contacts identity; the console echoes the same data the
 * batch file would print. All actions are real. */

const CONTACT_BAT = [
  "C:\\fadlan> contact.bat",
  `name:     ${profile.fullName}`,
  `email:    ${profile.email}`,
  `github:   ${profile.github.replace("https://", "")}`,
  `linkedin: ${profile.linkedin.replace("https://", "")}`,
];

export function ContactApp() {
  const { copied, copyEmail } = useCopyEmail();
  return (
    <ScrollArea style={{ height: "100%" }}>
      <div className="xp-shellview">
        <div className="xp-contact__head">
          <img src={xpIcon("contact")} alt="" width={40} height={40} draggable={false} />
          <div>
            <h1>{profile.fullName}</h1>
            <p>contact.bat — address book · {profile.location}</p>
          </div>
        </div>
        <dl className="xp-shellview__card">
          <div>
            <dt>email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>github</dt>
            <dd>
              <a href={profile.github} target="_blank" rel="noreferrer">
                {profile.github.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>linkedin</dt>
            <dd>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                {profile.linkedin.replace("https://", "")}
              </a>
            </dd>
          </div>
        </dl>
        <div className="xp-shellview__actions">
          <button
            type="button"
            className="cmd"
            onClick={() => void copyEmail()}
            data-state={copied ? "success" : undefined}
          >
            {copied ? "Copied" : "Copy email"}
          </button>
          <a className="cmd-link" href={`mailto:${profile.email}`}>
            Email
          </a>
          <a className="cmd-link" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="cmd-link" href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
        <pre className="xp-shellview__term" aria-label="contact.bat output">
          <code>{CONTACT_BAT.join("\n")}</code>
        </pre>
      </div>
    </ScrollArea>
  );
}

/* ---------- Explorer: My Computer dir browser (reuses FileTree data) ---------- */
export function ExplorerApp({
  path,
  onOpenFile,
}: {
  path: string;
  onOpenFile: (path: string) => void;
}) {
  const [dir, setDir] = useState(path);
  const open = useCallback(
    (raw: string) => {
      const res = parseCommand(
        raw.startsWith("cat ") || raw.startsWith("cd ") || raw.startsWith("open ")
          ? raw
          : `open ${raw}`,
        { cwd: dir },
      );
      for (const a of res.actions as ShellAction[]) {
        if (a.type === "cwd") {
          setDir(a.path);
          return;
        }
        if (a.type === "open") {
          onOpenFile(a.path);
          return;
        }
        if (a.type === "href" && typeof window !== "undefined") {
          window.open(a.url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [dir, onOpenFile],
  );
  return (
    <div style={{ display: "flex", height: "100%", background: "#fff", color: "#111" }}>
      <div style={{ width: 180, flexShrink: 0, borderRight: "1px solid #aca899", overflow: "auto" }}>
        <FileTree openPath={dir} onOpen={open} skin="ide" />
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "12px 14px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#666" }}>
          {dir.replace(HOME, "My Computer › fadlan")}
        </p>
        <FileView
          path={dir}
          skin="ide"
          onOpen={open}
          onCopyEmail={() => {}}
          copied={false}
        />
      </div>
    </div>
  );
}

/* ---------- Terminal: pure cmd-style console (files open in Notepad) ---------- */
type LogLine = { id: number; kind: string; text: string };

const TERM_COLORS: Record<string, string> = {
  "log-in": "#7fcf7f",
  "log-out": "#c0c0c0",
  "log-err": "#ff6b5e",
  "log-ok": "#7fcf7f",
  "log-dim": "#808080",
};

export function TerminalApp({ onOpenFile }: { onOpenFile: (path: string) => void }) {
  const [cwd, setCwd] = useState(HOME);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogLine[]>([
    { id: 0, kind: "log-dim", text: `login: ${profile.user}  pts/0  ${profile.location}` },
    { id: 1, kind: "log-out", text: "type  help  ·  Tab completes" },
  ]);
  const idRef = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hist = useRef<string[]>([]);
  const histIdx = useRef(-1);

  const push = useCallback((kind: string, lines: string[]) => {
    setLog((prev) => [
      ...prev,
      ...lines.map((text) => ({ id: ++idRef.current, kind, text })),
    ]);
  }, []);

  const run = useCallback(
    (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      push("log-in", [`${profile.user}@${profile.host}:${cwd === HOME ? "~" : cwd}$ ${trimmed}`]);
      hist.current = [trimmed, ...hist.current.filter((h) => h !== trimmed)];
      histIdx.current = -1;
      const res = parseCommand(trimmed, { cwd });
      for (const a of res.actions) {
        if (a.type === "clear") {
          setLog([]);
          continue;
        }
        if (a.type === "cwd") {
          setCwd(a.path);
          if (a.lines?.length) push("log-out", a.lines);
          continue;
        }
        if (a.type === "open") {
          push("log-ok", [`open  ${a.path}`]);
          onOpenFile(a.path);
          continue;
        }
        if (a.type === "href") {
          push("log-ok", a.lines);
          window.open(a.url, "_blank", "noopener,noreferrer");
          continue;
        }
        const mail = a.lines.find((l) => l.startsWith("MAILTO="));
        if (mail) {
          void navigator.clipboard
            ?.writeText(mail.slice(7))
            .then(() => push("log-ok", ["email copied to clipboard"]))
            .catch(() => {});
        }
        push(
          a.tone === "err" ? "log-err" : a.tone === "ok" ? "log-ok" : a.tone === "dim" ? "log-dim" : "log-out",
          a.lines,
        );
      }
      setInput("");
    },
    [cwd, onOpenFile, push],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [log]);

  const prompt = `${profile.user}@${profile.host}:${cwd === HOME ? "~" : cwd.replace(HOME, "~")}$`;

  return (
    <div className="xp-term">
      <div className="xp-term__log">
        {log.map((l) => (
          <p key={l.id} style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: TERM_COLORS[l.kind] ?? "#c0c0c0" }}>
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="xp-term__line"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <span aria-hidden="true" className="xp-term__prompt">{prompt}</span>
        <label className="sr-only" htmlFor="xp-term-input">Command</label>
        <input
          ref={inputRef}
          id="xp-term-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setInput(complete(e.currentTarget.value, cwd));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const n = Math.min(histIdx.current + 1, hist.current.length - 1);
              if (n >= 0 && hist.current[n]) {
                histIdx.current = n;
                setInput(hist.current[n]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const n = histIdx.current - 1;
              if (n < 0) {
                histIdx.current = -1;
                setInput("");
              } else {
                histIdx.current = n;
                setInput(hist.current[n] ?? "");
              }
            }
          }}
          placeholder="help"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="xp-term__input"
        />
      </form>
    </div>
  );
}

/* ---------- Camera: on-device webcam viewfinder + snapshots ----------
 * Everything stays in this browser: shots live in memory for the session,
 * nothing is uploaded. The permission prompt appears only after the user
 * presses "Turn on camera". */

type FacingMode = "user" | "environment";

type PaintTool = { id: string; label: string; hint: string; glyph: string };

const PAINT_TOOLS: PaintTool[] = [
  { id: "freeform", label: "Free-Form Select", hint: "Selects a free-form part of the picture.", glyph: "◌" },
  { id: "select", label: "Select", hint: "Selects a rectangular part of the picture.", glyph: "▢" },
  { id: "eraser", label: "Eraser", hint: "Erases a portion of the picture.", glyph: "▅" },
  { id: "fill", label: "Fill With Color", hint: "Fills an enclosed area with color.", glyph: "◩" },
  { id: "picker", label: "Pick Color", hint: "Picks a color from the live picture.", glyph: "◈" },
  { id: "magnifier", label: "Magnifier", hint: "Zooms the live picture in and out.", glyph: "⌕" },
  { id: "pencil", label: "Pencil", hint: "Draws a free-form line one pixel wide.", glyph: "✎" },
  { id: "brush", label: "Brush", hint: "Draws with a brush.", glyph: "✒" },
  { id: "airbrush", label: "Airbrush", hint: "Draws with an airbrush.", glyph: "⁂" },
  { id: "text", label: "Text", hint: "Adds a caption, burned into captures.", glyph: "A" },
  { id: "line", label: "Line", hint: "Draws a straight line.", glyph: "╲" },
  { id: "curve", label: "Curve", hint: "Draws a curved line.", glyph: "∿" },
  { id: "rect", label: "Rectangle", hint: "Draws a rectangle.", glyph: "▭" },
  { id: "polygon", label: "Polygon", hint: "Draws a polygon.", glyph: "⬠" },
  { id: "ellipse", label: "Ellipse", hint: "Draws an ellipse.", glyph: "⬯" },
  { id: "roundrect", label: "Rounded Rectangle", hint: "Draws a rounded rectangle.", glyph: "▨" },
];

const PAINT_COLORS = [
  "#000000", "#404040", "#7F7F7F", "#BFBFBF", "#880015", "#ED1C24", "#FF7F27",
  "#FFC90E", "#FFF200", "#22B14C", "#00A2E8", "#3F48CC", "#A349A4", "#FFFFFF",
  "#333333", "#666666", "#4C0000", "#990000", "#CC6600", "#808000", "#006600",
  "#003366", "#202060", "#660066", "#F5F4EA", "#E8A33D", "#B5E61D", "#99D9EA",
];

export function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"off" | "live" | "denied" | "unsupported">("off");
  const [facing, setFacing] = useState<FacingMode>("user");
  const [shots, setShots] = useState<string[]>([]);
  const [view, setView] = useState<"camera" | "paint">("camera");
  const [tool, setTool] = useState("select");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#FFFFFF");
  const [caption, setCaption] = useState("");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Release the camera when the window closes.
  useEffect(() => stop, [stop]);

  const enable = useCallback(
    async (mode: FacingMode) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      stop();
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus("live");
      } catch {
        setStatus("denied");
      }
    },
    [stop],
  );

  // Re-attaches the live stream whenever a video node mounts — the camera
  // and paint views each render their own <video>, only one at a time.
  const attachVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) node.srcObject = streamRef.current;
  }, []);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const text = caption.trim();
    if (text) {
      const fs = Math.max(16, Math.round(c.height * 0.055));
      ctx.font = `${fs}px Tahoma, sans-serif`;
      const pad = Math.round(fs * 0.6);
      const tw = ctx.measureText(text).width;
      const barH = fs + pad * 2;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, c.height - barH, tw + pad * 2, barH);
      ctx.fillStyle = fg;
      ctx.textBaseline = "top";
      ctx.fillText(text, pad, c.height - barH + pad);
    }
    setShots((prev) => [c.toDataURL("image/png"), ...prev].slice(0, 12));
  }, [caption, fg]);

  const switchCamera = useCallback(() => {
    const next: FacingMode = facing === "user" ? "environment" : "user";
    setFacing(next);
    void enable(next);
  }, [enable, facing]);

  const live = status === "live";
  const activeTool = PAINT_TOOLS.find((t) => t.id === tool) ?? PAINT_TOOLS[1];
  const zoomed = view === "paint" && tool === "magnifier" && live;

  const videoEl = (className: string) => (
    <video
      ref={attachVideo}
      className={className}
      autoPlay
      playsInline
      muted
      aria-label="Camera preview"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        setDims({ w: v.videoWidth, h: v.videoHeight });
      }}
    />
  );

  const offStates = () => (
    <>
      {status === "off" ? (
        <>
          <p className="xp-cam__nosignal">No signal</p>
          <button type="button" className="cmd" onClick={() => void enable(facing)}>
            Turn on camera
          </button>
          <p className="xp-cam__note">
            Uses your webcam on this device only. Nothing is uploaded.
          </p>
        </>
      ) : null}
      {status === "denied" ? (
        <>
          <p className="xp-cam__nosignal">Camera blocked</p>
          <p className="xp-cam__note">
            Access was denied. Allow the camera in the browser prompt,
            then try again.
          </p>
          <button type="button" className="cmd" onClick={() => void enable(facing)}>
            Try again
          </button>
        </>
      ) : null}
      {status === "unsupported" ? (
        <p className="xp-cam__note">This browser can’t access a camera.</p>
      ) : null}
    </>
  );

  const strip = (compact = false) =>
    shots.length > 0 ? (
      <div
        className={compact ? "xp-cam__strip is-compact" : "xp-cam__strip"}
        role="list"
        aria-label="Captured photos"
      >
        {shots.map((src, i) => (
          <figure key={`${i}-${src.slice(-16)}`} className="xp-cam__shot" role="listitem">
            <img src={src} alt={`Capture ${shots.length - i}`} />
            <figcaption>
              <a href={src} download={`capture-${shots.length - i}.png`}>
                Save
              </a>
              <button
                type="button"
                onClick={() => setShots((prev) => prev.filter((s) => s !== src))}
              >
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    ) : null;

  if (view === "paint") {
    return (
      <div className="xp-paint xp-mode-swap">
        <div className="xp-paint__main">
          <div className="xp-paint__tools" role="toolbar" aria-label="Paint toolbox">
            {PAINT_TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tool === t.id ? "xp-paint__tool is-active" : "xp-paint__tool"}
                title={t.label}
                aria-label={t.label}
                aria-pressed={tool === t.id}
                onClick={() => setTool(t.id)}
              >
                {t.glyph}
              </button>
            ))}
          </div>
          <div className="xp-paint__canvaswrap">
            {live
              ? videoEl(zoomed ? "xp-paint__video is-zoom" : "xp-paint__video")
              : (
                <div className="xp-cam__off" role="status">
                  {offStates()}
                </div>
              )}
            {live && tool === "text" && caption.trim() ? (
              <p className="xp-paint__caption" style={{ color: fg }}>
                {caption.trim()}
              </p>
            ) : null}
            <span className="xp-paint__handle xp-paint__handle--e" aria-hidden="true" />
            <span className="xp-paint__handle xp-paint__handle--s" aria-hidden="true" />
            <span className="xp-paint__handle xp-paint__handle--se" aria-hidden="true" />
          </div>
        </div>
        {tool === "text" ? (
          <div className="xp-paint__captionbar">
            <label htmlFor="xp-paint-caption">Caption</label>
            <input
              id="xp-paint-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 80))}
              placeholder="Burned into captures…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ) : null}
        <div className="xp-paint__colors">
          <div className="xp-paint__colorbox" aria-label={`Foreground ${fg}, background ${bg}`}>
            <span className="xp-paint__colorbg" style={{ background: bg }} />
            <span className="xp-paint__colorfg" style={{ background: fg }} />
          </div>
          <div className="xp-paint__swatches" role="group" aria-label="Color palette">
            {PAINT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="xp-paint__swatch"
                style={{ background: c }}
                title={`${c} — click for foreground, right-click for background`}
                aria-label={`Use ${c} as foreground color`}
                onClick={() => setFg(c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setBg(c);
                }}
              />
            ))}
          </div>
          <div className="xp-paint__capture">
            <button type="button" className="cmd" disabled={!live} onClick={capture}>
              Capture
            </button>
            <button type="button" className="cmd" disabled={!live} onClick={switchCamera}>
              Switch
            </button>
          </div>
        </div>
        {strip(true)}
        <div className="xp-paint__status">
          <span className="xp-paint__hint">{activeTool.hint}</span>
          <span>{dims ? `${dims.w}×${dims.h}` : "—"}</span>
          <button type="button" className="xp-paint__modebtn" onClick={() => setView("camera")}>
            Camera mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xp-cam xp-mode-swap">
      <div className="xp-cam__finder">
        {videoEl(live ? "xp-cam__video" : "xp-cam__video is-hidden")}
        {!live ? (
          <div className="xp-cam__off" role="status">
            {offStates()}
          </div>
        ) : null}
      </div>
      <div className="xp-cam__toolbar" role="toolbar" aria-label="Camera controls">
        <button type="button" className="cmd" disabled={!live} onClick={capture}>
          Capture
        </button>
        <button type="button" className="cmd" disabled={!live} onClick={switchCamera}>
          Switch camera
        </button>
        <span className="xp-cam__count" aria-live="polite">
          {shots.length === 0
            ? "no photos yet"
            : `${shots.length} photo${shots.length === 1 ? "" : "s"} · session only`}
        </span>
        <button type="button" className="cmd" onClick={() => setView("paint")}>
          Paint mode
        </button>
      </div>
      {strip()}
    </div>
  );
}

/* ---------- Internet Explorer 6: toolbar + address bar + portal pages ----------
 * Internal history (portal home, project pages) is real navigation; external
 * URLs open in the real browser; unknown addresses get the classic
 * "page cannot be displayed" treatment. */

const IE_HOME = "http://fadlan.portfolio/projects";

type IePage =
  | { url: string; kind: "home" }
  | { url: string; kind: "project"; slug: string }
  | { url: string; kind: "error" };

function ieResolve(raw: string): { page: IePage; external?: string } {
  const url = raw.trim();
  const lower = url.toLowerCase();
  if (/^https?:\/\//.test(lower) && !lower.includes("fadlan.portfolio")) {
    return { page: { url, kind: "error" }, external: url };
  }
  const m = lower
    .replace(/^https?:\/\//, "")
    .replace(/^fadlan\.portfolio\/?/, "")
    .replace(/^\/+/, "");
  if (m === "" || m === "projects" || m === "projects/") {
    return { page: { url: IE_HOME, kind: "home" } };
  }
  const pm = m.match(/^projects\/([\w-]+)\/?$/);
  if (pm && projects.some((p) => p.slug === pm[1])) {
    return { page: { url: `${IE_HOME}/${pm[1]}`, kind: "project", slug: pm[1] } };
  }
  return { page: { url, kind: "error" } };
}

export function IExploreApp({ onOpenFile }: { onOpenFile: (path: string) => void }) {
  const [hist, setHist] = useState<IePage[]>([{ url: IE_HOME, kind: "home" }]);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const page = hist[idx] ?? { url: IE_HOME, kind: "home" as const };

  const go = useCallback(
    (raw: string) => {
      const { page: next, external } = ieResolve(raw);
      if (external) {
        window.open(external, "_blank", "noopener,noreferrer");
        setDraft(null);
        return;
      }
      setHist((prev) => [...prev.slice(0, idx + 1), next]);
      setIdx(idx + 1);
      setDraft(null);
    },
    [idx],
  );

  const back = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
    setDraft(null);
  }, []);
  const fwd = useCallback(() => {
    setDraft(null);
    setIdx((i) => i + 1);
  }, []);
  const refresh = useCallback(() => {
    setDraft(null);
    setRev((r) => r + 1);
  }, []);
  const home = useCallback(() => go(IE_HOME), [go]);

  const openExternal = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="xp-ie" key={rev}>
      <div className="xp-ie__toolbar" role="toolbar" aria-label="Browser toolbar">
        <button
          type="button"
          className="xp-ie__back"
          disabled={idx <= 0}
          onClick={back}
          aria-label="Back"
          title="Back"
        >
          ➔
        </button>
        <button
          type="button"
          className="xp-ie__nav"
          disabled={idx >= hist.length - 1}
          onClick={fwd}
          aria-label="Forward"
          title="Forward"
        >
          ➔
        </button>
        <button type="button" className="xp-ie__nav" onClick={refresh} aria-label="Refresh" title="Refresh">
          ⟳
        </button>
        <button type="button" className="xp-ie__nav" onClick={home} aria-label="Home" title="Home">
          ⌂
        </button>
      </div>
      <form
        className="xp-ie__addrbar"
        onSubmit={(e) => {
          e.preventDefault();
          go(draft ?? page.url);
        }}
      >
        <label htmlFor="xp-ie-addr">Address</label>
        <input
          id="xp-ie-addr"
          value={draft ?? page.url}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="xp-ie__go">
          <span aria-hidden="true">➔</span> Go
        </button>
      </form>
      <div className="xp-ie__links" aria-label="Links bar">
        <span>Links</span>
        <span aria-hidden="true">»</span>
        <button type="button" onClick={home}>Projects</button>
        <button type="button" onClick={() => openExternal(profile.github)}>GitHub</button>
        <button type="button" onClick={() => openExternal(profile.linkedin)}>LinkedIn</button>
        <a href={`mailto:${profile.email}`}>Email</a>
      </div>
      <ScrollArea className="xp-ie__page">
        {page.kind === "home" ? (
          <IePortal onOpen={(slug) => go(`${IE_HOME}/${slug}`)} />
        ) : page.kind === "project" ? (
          <IeDetail
            slug={page.slug}
            onBack={back}
            onOpenFile={onOpenFile}
            onExternal={openExternal}
          />
        ) : (
          <IeError url={page.url} onHome={home} />
        )}
      </ScrollArea>
    </div>
  );
}

function IePortal({ onOpen }: { onOpen: (slug: string) => void }) {
  return (
    <div className="xp-ie__doc">
      <p className="xp-ie__crumb">fadlan.portfolio › projects</p>
      <h1>NimeList &amp; friends — {projects.length} public repos</h1>
      <p className="xp-ie__lede">
        Shipped work by {profile.fullName}, {profile.role.toLowerCase()} in{" "}
        {profile.location}. Click a title for the full write-up.
      </p>
      <ul className="xp-ie__cards">
        {projects.map((p) => (
          <li key={p.id}>
            <button type="button" className="xp-ie__title" onClick={() => onOpen(p.slug)}>
              {p.name}
            </button>
            <p>{p.blurb}</p>
            <p className="xp-ie__meta">{p.stack.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IeDetail({
  slug,
  onBack,
  onOpenFile,
  onExternal,
}: {
  slug: string;
  onBack: () => void;
  onOpenFile: (path: string) => void;
  onExternal: (url: string) => void;
}) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  return (
    <div className="xp-ie__doc">
      <p className="xp-ie__crumb">
        <button type="button" className="xp-ie__linklike" onClick={onBack}>
          ‹ projects
        </button>{" "}
        › {project.slug}
      </p>
      <h1>{project.name}</h1>
      <p className="xp-ie__lede">{project.blurb}</p>
      <table className="xp-ie__spec">
        <tbody>
          <tr>
            <th scope="row">language</th>
            <td>{project.language}</td>
          </tr>
          <tr>
            <th scope="row">stack</th>
            <td>{project.stack.join(" · ")}</td>
          </tr>
          {project.note ? (
            <tr>
              <th scope="row">note</th>
              <td>{project.note}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p className="xp-ie__actions">
        <button type="button" onClick={() => onOpenFile(`${HOME}/projects/${project.filename}`)}>
          Open in WordPad
        </button>
        <button type="button" onClick={() => onExternal(project.repo)}>
          Repo
        </button>
        {project.demo ? (
          <button type="button" onClick={() => onExternal(project.demo!)}>Live demo</button>
        ) : null}
      </p>
    </div>
  );
}

function IeError({ url, onHome }: { url: string; onHome: () => void }) {
  return (
    <div className="xp-ie__doc">
      <h1>The page cannot be displayed</h1>
      <p className="xp-ie__lede">
        The address <code>{url}</code> is not on this portfolio. The most likely
        causes: a typo, or a page that sailed with Internet Explorer 6.
      </p>
      <p>
        <button type="button" className="xp-ie__linklike" onClick={onHome}>
          Back to projects
        </button>
      </p>
    </div>
  );
}
