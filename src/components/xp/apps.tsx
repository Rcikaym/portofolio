"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as PaintPointerEvent } from "react";
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
    <div className="xp-explorer">
      <div className="xp-explorer__tree">
        <FileTree openPath={dir} onOpen={open} skin="ide" />
      </div>
      <div className="xp-explorer__main">
        <p className="xp-explorer__path">
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
  { id: "pencil", label: "Pencil", hint: "Draws a free-form line one pixel wide.", glyph: "✎" },
  { id: "brush", label: "Brush", hint: "Draws with a brush.", glyph: "✒" },
  { id: "airbrush", label: "Airbrush", hint: "Draws with an airbrush.", glyph: "⁂" },
  { id: "eraser", label: "Eraser", hint: "Erases back to the live picture.", glyph: "▅" },
  { id: "fill", label: "Fill With Color", hint: "Fills an enclosed area with color.", glyph: "◩" },
  { id: "picker", label: "Pick Color", hint: "Picks a color from the live picture.", glyph: "◈" },
  { id: "magnifier", label: "Magnifier", hint: "Zooms the live picture in and out.", glyph: "⌕" },
  { id: "text", label: "Text", hint: "Adds a caption, burned into captures.", glyph: "A" },
  { id: "line", label: "Line", hint: "Draws a straight line.", glyph: "╲" },
  { id: "rect", label: "Rectangle", hint: "Draws a rectangle.", glyph: "▭" },
  { id: "ellipse", label: "Ellipse", hint: "Draws an ellipse.", glyph: "⬯" },
  { id: "roundrect", label: "Rounded Rectangle", hint: "Draws a rounded rectangle.", glyph: "▨" },
];

const PAINT_COLORS = [
  "#000000", "#404040", "#7F7F7F", "#BFBFBF", "#880015", "#ED1C24", "#FF7F27",
  "#FFC90E", "#FFF200", "#22B14C", "#00A2E8", "#3F48CC", "#A349A4", "#FFFFFF",
  "#333333", "#666666", "#4C0000", "#990000", "#CC6600", "#808000", "#006600",
  "#003366", "#202060", "#660066", "#F5F4EA", "#E8A33D", "#B5E61D", "#99D9EA",
];

const BRUSH_SIZES = [3, 7, 12];

type DrawPoint = { x: number; y: number };

export function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"off" | "live" | "denied" | "unsupported">("off");
  const [facing, setFacing] = useState<FacingMode>("user");
  const [shots, setShots] = useState<string[]>([]);
  const [view, setView] = useState<"camera" | "paint">("camera");
  const [tool, setTool] = useState("pencil");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#FFFFFF");
  const [caption, setCaption] = useState("");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [brushSize, setBrushSize] = useState(7);
  const drawRef = useRef<HTMLCanvasElement | null>(null);
  const savedArt = useRef<string | null>(null);
  const snapRef = useRef<HTMLCanvasElement | null>(null);
  const strokeRef = useRef<{
    drawing: boolean;
    lastX: number;
    lastY: number;
    startX: number;
    startY: number;
  }>({ drawing: false, lastX: 0, lastY: 0, startX: 0, startY: 0 });

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

  const capture = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // What-you-see-is-what-you-save: mirror the snapshot too when enabled.
    ctx.save();
    if (mirrored) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    ctx.restore();
    // Paint layer on top of the feed (visible canvas, or saved snapshot).
    const art = drawRef.current;
    if (art && art.width > 1 && art.height > 1) {
      ctx.drawImage(art, 0, 0, c.width, c.height);
    } else if (savedArt.current) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = () => reject(new Error("art load failed"));
          im.src = savedArt.current as string;
        });
        ctx.drawImage(img, 0, 0, c.width, c.height);
      } catch {
        /* art unavailable — ship the bare frame */
      }
    }
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
  }, [caption, fg, mirrored]);

  const switchCamera = useCallback(() => {
    const next: FacingMode = facing === "user" ? "environment" : "user";
    setFacing(next);
    void enable(next);
  }, [enable, facing]);

  /* Mirror is deliberately discreet: no dedicated button. Toggle by
   * double-clicking the preview/canvas, clicking the dimensions readout,
   * or pressing M while focus is inside this window. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleMirror = useCallback(() => setMirrored((m) => !m), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== "m") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (!rootRef.current?.contains(document.activeElement)) return;
      e.preventDefault();
      setMirrored((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focusRoot = useCallback(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  /* ---------- Paint drawing engine: transparent layer over the feed ---------- */

  const isShapeTool = (id: string) =>
    id === "line" || id === "rect" || id === "ellipse" || id === "roundrect";

  // Sizes the visible drawing canvas to its wrapper (crisp on hidpi),
  // preserving existing strokes across resizes.
  const fitDrawCanvas = (node: HTMLCanvasElement) => {
    const wrap = node.parentElement;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = wrap?.clientWidth ?? 0;
    const h = wrap?.clientHeight ?? 0;
    if (w < 2 || h < 2) return null;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    const ctx = node.getContext("2d");
    if (!ctx) return null;
    if (node.width !== bw || node.height !== bh) {
      let prev: HTMLCanvasElement | null = null;
      if (node.width > 0 && node.height > 0) {
        prev = document.createElement("canvas");
        prev.width = node.width;
        prev.height = node.height;
        prev.getContext("2d")?.drawImage(node, 0, 0);
      }
      node.width = bw;
      node.height = bh;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prev) ctx.drawImage(prev, 0, 0, w, h);
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return { ctx, w, h, dpr };
  };

  // Mounted afresh each time Paint mode opens: size it and restore strokes
  // saved when leaving Paint mode.
  const drawAttach = useCallback((node: HTMLCanvasElement | null) => {
    drawRef.current = node;
    if (!node) return;
    fitDrawCanvas(node);
    const saved = savedArt.current;
    if (saved) {
      savedArt.current = null;
      const img = new Image();
      img.onload = () => {
        const fit = fitDrawCanvas(node);
        if (fit) fit.ctx.drawImage(img, 0, 0, fit.w, fit.h);
      };
      img.src = saved;
    }
  }, []);

  const snapshotDraw = () => {
    const node = drawRef.current;
    if (!node || node.width < 2) return;
    let snap = snapRef.current;
    if (!snap) {
      snap = document.createElement("canvas");
      snapRef.current = snap;
    }
    snap.width = node.width;
    snap.height = node.height;
    snap.getContext("2d")?.drawImage(node, 0, 0);
  };

  const restoreDraw = () => {
    const node = drawRef.current;
    const snap = snapRef.current;
    if (!node || !snap || snap.width < 2) return;
    const fit = fitDrawCanvas(node);
    fit?.ctx.drawImage(snap, 0, 0, fit.w, fit.h);
  };

  const paintStroke = (
    ctx: CanvasRenderingContext2D,
    color: string,
    width: number,
    composite: GlobalCompositeOperation,
    from: DrawPoint,
    to: DrawPoint,
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = composite;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const sprayPaint = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    const n = 12 + radius * 4;
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * radius;
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.5, 1.5);
    }
    ctx.restore();
  };

  const paintShape = (ctx: CanvasRenderingContext2D, kind: string, a: DrawPoint, b: DrawPoint) => {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(a.x - b.x);
    const h = Math.abs(a.y - b.y);
    ctx.save();
    ctx.strokeStyle = fg;
    ctx.lineWidth = Math.max(2, brushSize);
    ctx.beginPath();
    if (kind === "line") {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    } else if (kind === "ellipse") {
      ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2);
    } else if (kind === "roundrect") {
      const r = Math.min(12, w / 4, h / 4);
      const withRound = ctx as CanvasRenderingContext2D & {
        roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
      };
      if (typeof withRound.roundRect === "function") withRound.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.stroke();
    ctx.restore();
  };

  const floodFill = (
    ctx: CanvasRenderingContext2D,
    bw: number,
    bh: number,
    sx: number,
    sy: number,
    hex: string,
  ) => {
    const img = ctx.getImageData(0, 0, bw, bh);
    const d = img.data;
    const fr = parseInt(hex.slice(1, 3), 16);
    const fgC = parseInt(hex.slice(3, 5), 16);
    const fb = parseInt(hex.slice(5, 7), 16);
    const at = (x: number, y: number) => (y * bw + x) * 4;
    if (sx < 0 || sy < 0 || sx >= bw || sy >= bh) return;
    const si = at(sx, sy);
    const tr = d[si];
    const tg = d[si + 1];
    const tb = d[si + 2];
    const ta = d[si + 3];
    const tol = 48;
    const isTarget = (i: number) =>
      Math.abs(d[i] - tr) <= tol &&
      Math.abs(d[i + 1] - tg) <= tol &&
      Math.abs(d[i + 2] - tb) <= tol &&
      Math.abs(d[i + 3] - ta) <= tol;
    if (Math.abs(tr - fr) <= tol && Math.abs(tg - fgC) <= tol && Math.abs(tb - fb) <= tol && ta > 200) {
      return;
    }
    const stack: Array<[number, number]> = [[sx, sy]];
    let guard = bw * bh;
    while (stack.length > 0 && guard-- > 0) {
      const [x, y] = stack.pop() as [number, number];
      if (x < 0 || y < 0 || x >= bw || y >= bh) continue;
      const i = at(x, y);
      if (!isTarget(i)) continue;
      d[i] = fr;
      d[i + 1] = fgC;
      d[i + 2] = fb;
      d[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(img, 0, 0);
  };

  const pickColor = (ctx: CanvasRenderingContext2D, bw: number, bh: number, sx: number, sy: number) => {
    const x = Math.min(bw - 1, Math.max(0, sx));
    const y = Math.min(bh - 1, Math.max(0, sy));
    const px = ctx.getImageData(x, y, 1, 1).data;
    if (px[3] < 16) return;
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    setFg(`#${toHex(px[0])}${toHex(px[1])}${toHex(px[2])}`);
  };

  const drawPos = (e: PaintPointerEvent<HTMLCanvasElement>): DrawPoint => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDrawDown = (e: PaintPointerEvent<HTMLCanvasElement>) => {
    if (!live || e.button !== 0) return;
    e.preventDefault();
    const node = drawRef.current;
    if (!node) return;
    const fit = fitDrawCanvas(node);
    if (!fit) return;
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const p = drawPos(e);
    if (tool === "fill") {
      floodFill(
        fit.ctx,
        node.width,
        node.height,
        Math.floor(p.x * fit.dpr),
        Math.floor(p.y * fit.dpr),
        fg,
      );
      return;
    }
    if (tool === "picker") {
      pickColor(
        fit.ctx,
        node.width,
        node.height,
        Math.floor(p.x * fit.dpr),
        Math.floor(p.y * fit.dpr),
      );
      return;
    }
    snapshotDraw();
    strokeRef.current = { drawing: true, lastX: p.x, lastY: p.y, startX: p.x, startY: p.y };
    if (tool === "airbrush") sprayPaint(fit.ctx, p.x, p.y, brushSize, fg);
  };

  const onDrawMove = (e: PaintPointerEvent<HTMLCanvasElement>) => {
    const s = strokeRef.current;
    if (!s.drawing || !live) return;
    e.preventDefault();
    const node = drawRef.current;
    if (!node) return;
    const fit = fitDrawCanvas(node);
    if (!fit) return;
    const p = drawPos(e);
    if (isShapeTool(tool)) {
      restoreDraw();
      paintShape(fit.ctx, tool, { x: s.startX, y: s.startY }, p);
      return;
    }
    if (tool === "airbrush") {
      sprayPaint(fit.ctx, p.x, p.y, brushSize, fg);
      s.lastX = p.x;
      s.lastY = p.y;
      return;
    }
    const width = tool === "eraser" ? brushSize * 2 : tool === "brush" ? brushSize : 2;
    paintStroke(fit.ctx, fg, width, tool === "eraser" ? "destination-out" : "source-over", { x: s.lastX, y: s.lastY }, p);
    s.lastX = p.x;
    s.lastY = p.y;
  };

  const endStroke = (e: PaintPointerEvent<HTMLCanvasElement>) => {
    const s = strokeRef.current;
    if (!s.drawing) return;
    s.drawing = false;
    if (isShapeTool(tool) && live) {
      const node = drawRef.current;
      if (!node) return;
      const fit = fitDrawCanvas(node);
      if (!fit) return;
      const p = drawPos(e);
      restoreDraw();
      paintShape(fit.ctx, tool, { x: s.startX, y: s.startY }, p);
    }
  };

  const clearDrawing = () => {
    const node = drawRef.current;
    if (node) {
      const fit = fitDrawCanvas(node);
      fit?.ctx.clearRect(0, 0, fit.w, fit.h);
    }
    savedArt.current = null;
  };

  // Drawings survive mode switches via a saved snapshot (no remount loss).
  const goPaint = () => setView("paint");
  const goCamera = () => {
    const node = drawRef.current;
    if (node && node.width > 1) {
      try {
        savedArt.current = node.toDataURL("image/png");
      } catch {
        savedArt.current = null;
      }
    }
    setView("camera");
  };

  const live = status === "live";
  const activeTool = PAINT_TOOLS.find((t) => t.id === tool) ?? PAINT_TOOLS[0];
  const zoomed = view === "paint" && tool === "magnifier" && live;
  const camVideoClass = ["xp-cam__video", live ? "" : "is-hidden", mirrored ? "is-mirror" : ""]
    .filter(Boolean)
    .join(" ");
  const paintVideoClass = ["xp-paint__video", zoomed ? "is-zoom" : "", mirrored ? "is-mirror" : ""]
    .filter(Boolean)
    .join(" ");

  const videoEl = (className: string) => (
    <video
      ref={attachVideo}
      className={className}
      autoPlay
      playsInline
      muted
      aria-label="Camera preview"
      title={mirrored ? "Mirror is on — double-click for true view" : "Mirror is off — double-click for selfie view"}
      onDoubleClick={toggleMirror}
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
      <div
        className="xp-paint xp-mode-swap"
        ref={rootRef}
        tabIndex={-1}
        onPointerDown={focusRoot}
      >
        <div className="xp-paint__main">
          <div className="xp-paint__side">
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
            <div className="xp-paint__options" role="group" aria-label="Brush size">
              {BRUSH_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={brushSize === s ? "xp-paint__size is-active" : "xp-paint__size"}
                  aria-pressed={brushSize === s}
                  aria-label={`Brush size ${s} pixels`}
                  title={`${s}px brush`}
                  onClick={() => setBrushSize(s)}
                >
                  <span style={{ width: Math.min(18, s + 4), height: Math.min(18, s + 4) }} />
                </button>
              ))}
            </div>
          </div>
          <div
            className="xp-paint__canvaswrap"
            onDoubleClick={toggleMirror}
            title={mirrored ? "Mirror is on — double-click for true view" : "Mirror is off — double-click for selfie view"}
          >
            {live
              ? videoEl(paintVideoClass)
              : (
                <div className="xp-cam__off" role="status">
                  {offStates()}
                </div>
              )}
            <canvas
              ref={drawAttach}
              className={live ? "xp-paint__draw is-live" : "xp-paint__draw"}
              role="img"
              aria-label={`Drawing layer. ${activeTool.label} selected. Drag to draw.`}
              onPointerDown={onDrawDown}
              onPointerMove={onDrawMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
            />
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
            <button type="button" className="cmd" disabled={!live} onClick={() => void capture()}>
              Capture
            </button>
            <button type="button" className="cmd" disabled={!live} onClick={switchCamera}>
              Switch
            </button>
            <button type="button" className="cmd" onClick={clearDrawing}>
              Clear
            </button>
          </div>
        </div>
        {strip(true)}
          <div className="xp-paint__status">
          <span className="xp-paint__hint">{activeTool.hint}</span>
          <button
            type="button"
            className="xp-paint__dims"
            onClick={toggleMirror}
            title={mirrored ? "Mirror is on — click for true view" : "Mirror is off — click for selfie view"}
          >
            {dims ? `${dims.w}×${dims.h}` : "—"}
          </button>
          <button type="button" className="xp-paint__modebtn" onClick={goCamera}>
            Camera mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="xp-cam xp-mode-swap"
      ref={rootRef}
      tabIndex={-1}
      onPointerDown={focusRoot}
    >
      <div className="xp-cam__finder">
        {videoEl(camVideoClass)}
        {!live ? (
          <div className="xp-cam__off" role="status">
            {offStates()}
          </div>
        ) : null}
      </div>
      <div className="xp-cam__toolbar" role="toolbar" aria-label="Camera controls">
        <button type="button" className="cmd" disabled={!live} onClick={() => void capture()}>
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
        <button type="button" className="cmd" onClick={goPaint}>
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
