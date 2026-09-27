"use client";

import { useEffect, useState } from "react";
import type { XpAppId, XpWindow } from "./xp-types";
import { windowIconKey } from "./app-defs";
import { xpIcon, type XpIconKey } from "./xp-icons";

type Props = {
  windows: XpWindow[];
  activeId: string | null;
  startOpen: boolean;
  onToggleStart: () => void;
  onFocus: (id: string) => void;
  onLaunch: (app: XpAppId, path?: string) => void;
  onCloseStart: () => void;
  onShowChooser: () => void;
  onPowerOff: () => void;
};

/* Left column: pinned programs (white). Right column: places (blue). */
const START_PROGRAMS: { app: XpAppId; title: string; sub: string; icon: XpIconKey; path?: string }[] = [
  { app: "iexplore", title: "Internet", sub: "Internet Explorer", icon: "iexplore" },
  { app: "notepad", title: "E-mail", sub: "contact.bat", icon: "contact", path: "~/fadlan/contact.sh" },
  { app: "terminal", title: "Terminal", sub: "Unix shell", icon: "terminal" },
  { app: "editor", title: "Editor", sub: "workspace", icon: "editor" },
  { app: "notepad", title: "Notepad", sub: "about.rtf", icon: "document", path: "~/fadlan/about.md" },
  { app: "notepad", title: "experience.log", sub: "jobs & certs", icon: "log", path: "~/fadlan/experience.log" },
  { app: "camera", title: "Camera", sub: "webcam snapshots", icon: "camera" },
];

const START_PLACES: { label: string; icon: XpIconKey; app: XpAppId; path?: string }[] = [
  { label: "My Documents", icon: "folderClosed", app: "notepad", path: "~/fadlan/README.md" },
  { label: "My Computer", icon: "myComputer", app: "explorer" },
  { label: "My Network Places", icon: "network", app: "iexplore" },
  { label: "Control Panel", icon: "control", app: "notepad", path: "~/fadlan/contact.sh" },
  { label: "Help and Support", icon: "help", app: "notepad", path: "~/fadlan/about.md" },
  { label: "Search", icon: "editor", app: "editor" },
  { label: "Run...", icon: "run", app: "terminal" },
];

export function Taskbar({
  windows,
  activeId,
  startOpen,
  onToggleStart,
  onFocus,
  onLaunch,
  onCloseStart,
  onShowChooser,
  onPowerOff,
}: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!startOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startOpen, onCloseStart]);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <>
      {startOpen ? (
        <nav className="xp-startmenu" aria-label="Start menu">
          <div className="xp-startmenu__head">
            <img src={xpIcon("user")} alt="" width={40} height={40} draggable={false} />
            fadlan
          </div>
          <div className="xp-startmenu__body">
            <ul className="xp-startmenu__list" aria-label="Pinned programs">
              {START_PROGRAMS.map((a) => (
                <li key={`${a.app}-${a.title}-${a.sub}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunch(a.app, a.path);
                      onCloseStart();
                    }}
                  >
                    <img src={xpIcon(a.icon)} alt="" width={28} height={28} draggable={false} />
                    <span>
                      {a.title}
                      <span className="xp-startmenu__sub">{a.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <ul className="xp-startmenu__list xp-startmenu__list--places" aria-label="Places">
              {START_PLACES.map((p) => (
                <li key={p.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunch(p.app, p.path);
                      onCloseStart();
                    }}
                  >
                    <img src={xpIcon(p.icon)} alt="" width={24} height={24} draggable={false} />
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="xp-startmenu__foot">
            <button type="button" onClick={onShowChooser}>
              <span className="xp-startmenu__power" aria-hidden="true" style={{ background: "#e8a33d" }}>◉</span>
              Log Off
            </button>
            <button type="button" onClick={onPowerOff}>
              <span className="xp-startmenu__power" aria-hidden="true" style={{ background: "#d64f1e" }}>⏻</span>
              Turn Off Computer
            </button>
          </div>
        </nav>
      ) : null}
      <footer className="xp-taskbar" aria-label="Taskbar">
        <button
          type="button"
          className="xp-start"
          aria-expanded={startOpen}
          aria-haspopup="menu"
          onClick={onToggleStart}
        >
          <img src={xpIcon("user")} alt="" width={20} height={20} draggable={false} /> start
        </button>
        <div className="xp-tasks" role="toolbar" aria-label="Open windows">
          {windows.map((w) => (
            <button
              key={w.id}
              type="button"
              className={w.id === activeId && !w.minimized ? "xp-task is-on" : "xp-task"}
              aria-pressed={w.id === activeId && !w.minimized}
              onClick={() => onFocus(w.id)}
            >
              <img src={xpIcon(windowIconKey(w))} alt="" width={16} height={16} draggable={false} />
              {w.title}
            </button>
          ))}
        </div>
        <div className="xp-tray" aria-label="System tray">
          <time>{time}</time>
        </div>
      </footer>
    </>
  );
}
