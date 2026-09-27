"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowFrame } from "./window-frame";
import { Taskbar } from "./taskbar";
import {
  CameraApp,
  ContactApp,
  ExplorerApp,
  IExploreApp,
  LogViewApp,
  TerminalApp,
  WordPadApp,
} from "./apps";
import { IdeWorkspace } from "@/components/ide-workspace";
import { HOME, profile } from "@/lib/content";
import { defaultOpen } from "@/lib/shell";
import { xpId, type XpAppId, type XpWindow } from "./xp-types";
import {
  displayNameForPath,
  docKindForPath,
  docTitleForPath,
  windowIconKey,
} from "./app-defs";
import { xpIcon, type XpIconKey } from "./xp-icons";

export type XpInitial = "welcome" | "terminal" | "editor";

const BOOT_KEY = "rcikaym-xp-boot";

function cascade(n: number) {
  return { x: 60 + n * 32, y: 24 + n * 28, w: 640, h: 440 };
}

function makeWindow(app: XpAppId, path: string | undefined, z: number, n: number, small: boolean): XpWindow {
  const c = cascade(n % 6);
  const base: XpWindow = {
    id: xpId(),
    app,
    title: "Window",
    x: c.x,
    y: c.y,
    w: small ? 0 : c.w,
    h: small ? 0 : c.h,
    z,
    minimized: false,
    maximized: small,
  };
  switch (app) {
    case "terminal":
      return { ...base, title: "Terminal — fadlan@rcikaym" };
    case "editor":
      return { ...base, title: "Editor — fadlan workspace" };
    case "explorer":
      return { ...base, title: "My Computer — fadlan", path: path ?? HOME };
    case "notepad": {
      const target = path ?? defaultOpen();
      return {
        ...base,
        title: docTitleForPath(target),
        path: target,
        w: small ? 0 : 520,
        h: small ? 0 : 420,
      };
    }
    case "iexplore":
      return { ...base, title: "Internet Explorer — projects" };
    case "camera":
      return {
        ...base,
        title: "Camera",
        w: small ? 0 : 560,
        h: small ? 0 : 480,
      };
  }
}

const ICONS: { app: XpAppId; label: string; icon: XpIconKey; path?: string }[] = [
  { app: "explorer", label: "My Computer", icon: "myComputer" },
  { app: "terminal", label: "Terminal", icon: "terminal" },
  { app: "editor", label: "Editor", icon: "editor" },
  { app: "notepad", label: "about.rtf", icon: "document", path: `${HOME}/about.md` },
  { app: "notepad", label: "experience.log", icon: "log", path: `${HOME}/experience.log` },
  { app: "iexplore", label: "Internet Explorer", icon: "iexplore" },
  { app: "camera", label: "Camera", icon: "camera" },
  { app: "notepad", label: "contact.bat", icon: "contact", path: `${HOME}/contact.sh` },
];

export function XpDesktop({ initial = "welcome" }: { initial?: XpInitial }) {
  const [windows, setWindows] = useState<XpWindow[]>(() => {
    let z = 10;
    const n = () => {
      z += 1;
      return z;
    };
    const narrow =
      typeof window !== "undefined" ? window.innerWidth < 640 : false;
    if (initial === "terminal") {
      return [
        makeWindow("terminal", undefined, n(), 0, narrow),
        makeWindow("notepad", defaultOpen(), n(), 1, narrow),
      ];
    }
    if (initial === "editor") {
      return [makeWindow("editor", undefined, n(), 0, narrow)];
    }
    return [makeWindow("notepad", defaultOpen(), n(), 0, narrow)];
  });
  const [activeId, setActiveId] = useState<string | null>(
    () => windows[windows.length - 1]?.id ?? null,
  );
  const [startOpen, setStartOpen] = useState(false);
  const [booted, setBooted] = useState(() => {
    try {
      return (
        typeof window !== "undefined" &&
        sessionStorage.getItem(BOOT_KEY) === "1"
      );
    } catch {
      return false;
    }
  });
  const [stage, setStage] = useState({ w: 1024, h: 768 });
  const zRef = useRef(10);
  const stageRef = useRef<HTMLDivElement>(null);
  const small = stage.w < 640;

  const nextZ = useCallback(() => {
    zRef.current += 1;
    return zRef.current;
  }, []);

  const launch = useCallback(
    (app: XpAppId, path?: string) => {
      setWindows((prev) => {
        // reuse existing notepad/explorer for same path
        if ((app === "notepad" || app === "explorer") && path) {
          const found = prev.find((w) => w.app === app && w.path === path);
          if (found) {
            setActiveId(found.id);
            return prev.map((w) =>
              w.id === found.id ? { ...w, minimized: false, z: nextZ() } : w,
            );
          }
        } else {
          const found = prev.find((w) => w.app === app && !w.path);
          if (found && (app === "terminal" || app === "editor" || app === "iexplore" || app === "camera")) {
            setActiveId(found.id);
            return prev.map((w) =>
              w.id === found.id ? { ...w, minimized: false, z: nextZ() } : w,
            );
          }
        }
        const win = makeWindow(app, path, nextZ(), prev.length, small || window.innerWidth < 640);
        setActiveId(win.id);
        return [...prev, win];
      });
    },
    [nextZ, small],
  );

  // stage size for maximize bounds + small-screen detection
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setStage({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // boot overlay (XP loader, skippable, reduced-motion aware)
  useEffect(() => {
    if (booted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(
      () => {
        setBooted(true);
        try {
          sessionStorage.setItem(BOOT_KEY, "1");
        } catch {
          /* private mode */
        }
      },
      reduce ? 300 : 1900,
    );
    return () => window.clearTimeout(t);
  }, [booted]);

  const focus = useCallback(
    (id: string) => {
      setActiveId(id);
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, minimized: false, z: nextZ() } : w)),
      );
    },
    [nextZ],
  );
  const move = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);
  const keyboardMove = useCallback((id: string, dx: number, dy: number) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, maximized: false, x: Math.max(0, w.x + dx), y: Math.max(0, w.y + dy) }
          : w,
      ),
    );
  }, []);
  const toggleMax = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
    );
  }, []);
  const minimize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);
  const close = useCallback((id: string) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setActiveId((cur) => {
        if (cur !== id) return cur;
        const top = [...next].sort((a, b) => b.z - a.z)[0];
        return top ? top.id : null;
      });
      return next;
    });
  }, []);

  const openFile = useCallback(
    (path: string) => {
      launch("notepad", path);
    },
    [launch],
  );

  const showChooser = useCallback(() => {
    setStartOpen(false);
    launch("notepad", defaultOpen());
  }, [launch]);

  const powerOff = useCallback(() => {
    setStartOpen(false);
    setWindows([]);
    setActiveId(null);
    try {
      sessionStorage.removeItem(BOOT_KEY);
    } catch {
      /* private mode */
    }
    setBooted(false);
  }, []);

  const ordered = useMemo(() => [...windows].sort((a, b) => a.z - b.z), [windows]);

  return (
    <div className="xp-root" data-testid="xp-desktop">
      <div className="xp-wallpaper" aria-hidden="true" />
      <a className="skip" href="#xp-tasks" style={{ zIndex: 9999 }}>
        skip to taskbar
      </a>

      <div className="xp-stage" ref={stageRef}>
        <div className="xp-icons" role="toolbar" aria-label="Desktop icons">
          {ICONS.map((icon) => (
            <button
              key={`${icon.app}-${icon.label}`}
              type="button"
              className="xp-icon"
              onDoubleClick={() => launch(icon.app, icon.path)}
              onClick={() => launch(icon.app, icon.path)}
              aria-label={`Open ${icon.label}`}
            >
              <span className="xp-icon__glyph" aria-hidden="true">
                <img src={xpIcon(icon.icon)} alt="" width={32} height={32} draggable={false} />
              </span>
              {icon.label}
            </button>
          ))}
        </div>

        {ordered.map((w) => {
          const docKind = w.app === "notepad" ? docKindForPath(w.path ?? "") : null;
          return (
          <WindowFrame
            key={w.id}
            win={w.maximized || small ? { ...w, maximized: true } : w}
            active={w.id === activeId}
            maxBounds={stage}
            iconUrl={xpIcon(windowIconKey(w))}
            onFocus={focus}
            onMove={move}
            onKeyboardMove={keyboardMove}
            onToggleMax={toggleMax}
            onMinimize={minimize}
            onClose={close}
            menu={
              w.app === "editor" || w.app === "iexplore" ? undefined : w.app === "camera" ? (
                <>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Image</span>
                  <span>Colors</span>
                  <span>Help</span>
                </>
              ) : w.app === "explorer" ? (
                <>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Favorites</span>
                  <span>Tools</span>
                  <span>Help</span>
                </>
              ) : docKind === "wordpad" ? (
                <>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Insert</span>
                  <span>Format</span>
                  <span>Help</span>
                </>
              ) : docKind === "logview" ? (
                <>
                  <span>File</span>
                  <span>View</span>
                  <span>Tools</span>
                  <span>Help</span>
                </>
              ) : (
                <>
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Help</span>
                </>
              )
            }
            status={
              <>
                <span className="xp-statusbar__grow">
                  {w.app === "explorer"
                    ? `${(w.path ?? HOME).replace(HOME, "My Computer › fadlan")}`
                    : w.app === "terminal"
                      ? `${profile.user}@${profile.host}`
                      : w.app === "iexplore"
                        ? "Done"
                        : w.app === "camera"
                          ? "Preview"
                          : displayNameForPath(w.path ?? "")}
                </span>
                <span>{profile.handle}</span>
              </>
            }
          >
            {w.app === "terminal" ? <TerminalApp onOpenFile={openFile} /> : null}
            {w.app === "editor" ? (
              <div style={{ height: "100%", minHeight: 0 }}>
                <IdeWorkspace />
              </div>
            ) : null}
            {w.app === "explorer" ? (
              <ExplorerApp path={w.path ?? HOME} onOpenFile={openFile} />
            ) : null}
            {w.app === "notepad" && docKind === "wordpad" ? (
              <WordPadApp path={w.path ?? defaultOpen()} />
            ) : null}
            {w.app === "notepad" && docKind === "logview" ? (
              <LogViewApp path={w.path ?? defaultOpen()} />
            ) : null}
            {w.app === "notepad" && docKind === "shell" ? <ContactApp /> : null}
            {w.app === "iexplore" ? <IExploreApp onOpenFile={openFile} /> : null}
            {w.app === "camera" ? <CameraApp /> : null}
          </WindowFrame>
          );
        })}
      </div>

      <div id="xp-tasks">
        <Taskbar
          windows={windows}
          activeId={activeId}
          startOpen={startOpen}
          onToggleStart={() => setStartOpen((v) => !v)}
          onFocus={focus}
          onLaunch={launch}
          onCloseStart={() => setStartOpen(false)}
          onShowChooser={showChooser}
          onPowerOff={powerOff}
        />
      </div>

      {!booted ? (
        <div
          className="xp-boot"
          role="status"
          aria-label="Welcome to fadlanxp"
          onClick={() => {
            setBooted(true);
            try {
              sessionStorage.setItem(BOOT_KEY, "1");
            } catch {
              /* private mode */
            }
          }}
          onKeyDown={() => {
            setBooted(true);
            try {
              sessionStorage.setItem(BOOT_KEY, "1");
            } catch {
              /* private mode */
            }
          }}
          tabIndex={0}
        >
          <p className="xp-boot__brand">
            fadlan<sup>xp</sup> <span>Professional</span>
          </p>
          <p className="xp-boot__logo">
            welcome
            <span className="xp-boot__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </p>
          <p className="xp-boot__hint">click anywhere or press any key to enter</p>
          <button
            type="button"
            className="xp-boot__skip"
            onClick={(e) => {
              e.stopPropagation();
              setBooted(true);
              try {
                sessionStorage.setItem(BOOT_KEY, "1");
              } catch {
                /* private mode */
              }
            }}
          >
            Skip
          </button>
        </div>
      ) : null}
    </div>
  );
}
