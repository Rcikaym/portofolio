"use client";

import { useRef, type PointerEvent as RPE, type ReactNode } from "react";
import type { XpWindow } from "./xp-types";

type Props = {
  win: XpWindow;
  active: boolean;
  children: ReactNode;
  menu?: ReactNode;
  status?: ReactNode;
  iconUrl?: string;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggleMax: (id: string) => void;
  onMinimize: (id: string) => void;
  onClose: (id: string) => void;
  onKeyboardMove: (id: string, dx: number, dy: number) => void;
  maxBounds: { w: number; h: number };
};

export function WindowFrame({
  win,
  active,
  children,
  menu,
  status,
  iconUrl,
  onFocus,
  onMove,
  onToggleMax,
  onMinimize,
  onClose,
  onKeyboardMove,
  maxBounds,
}: Props) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(
    null,
  );

  const style = win.maximized
    ? { left: 0, top: 0, width: maxBounds.w, height: maxBounds.h, zIndex: win.z }
    : {
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      };

  const down = (e: RPE<HTMLDivElement>) => {
    if (win.maximized) return;
    if ((e.target as HTMLElement).closest("button")) return;
    onFocus(win.id);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: RPE<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || win.maximized) return;
    const nx = Math.max(
      -win.w + 80,
      Math.min(maxBounds.w - 80, d.ox + (e.clientX - d.sx)),
    );
    const ny = Math.max(0, Math.min(maxBounds.h - 40, d.oy + (e.clientY - d.sy)));
    onMove(win.id, nx, ny);
  };
  const up = () => {
    drag.current = null;
  };

  if (win.minimized) return null;

  return (
    <section
      className={
        win.maximized
          ? active
            ? "xp-win is-max is-active"
            : "xp-win is-max"
          : active
            ? "xp-win is-active"
            : "xp-win"
      }
      style={style}
      data-active={active ? "true" : undefined}
      aria-label={win.title}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className="xp-titlebar"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={() => onToggleMax(win.id)}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            width={16}
            height={16}
            draggable={false}
            className="xp-titlebar__icon"
          />
        ) : null}
        <span className="xp-titlebar__text">{win.title}</span>
        <div
          className="xp-titlebar__btns"
          role="group"
          aria-label={`${win.title} window controls`}
        >
          <button
            type="button"
            className="xp-tbtn"
            aria-label={`Minimize ${win.title}`}
            onClick={() => onMinimize(win.id)}
          >
            _
          </button>
          <button
            type="button"
            className="xp-tbtn"
            aria-label={win.maximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
            onClick={() => onToggleMax(win.id)}
          >
            ▢
          </button>
          <button
            type="button"
            className="xp-tbtn xp-tbtn--close"
            aria-label={`Close ${win.title}`}
            onClick={() => onClose(win.id)}
          >
            ✕
          </button>
        </div>
      </div>
      {menu ? <div className="xp-menubar">{menu}</div> : null}
      <div className="xp-win-body">{children}</div>
      {status ? <div className="xp-statusbar">{status}</div> : null}
      <span className="sr-only">
        Press Alt plus arrow keys while focused on the title bar to move this
        window.
      </span>
      <div
        tabIndex={0}
        aria-hidden="true"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
        onKeyDown={(e) => {
          if (!e.altKey) return;
          const step = e.shiftKey ? 24 : 8;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            onKeyboardMove(win.id, -step, 0);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            onKeyboardMove(win.id, step, 0);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            onKeyboardMove(win.id, 0, -step);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onKeyboardMove(win.id, 0, step);
          }
        }}
      />
    </section>
  );
}
