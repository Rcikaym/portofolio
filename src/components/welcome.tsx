"use client";

import { useEffect, type CSSProperties } from "react";
import { profile } from "@/lib/content";
import type { SessionId } from "@/lib/session";

type WelcomeProps = {
  onPick: (id: SessionId) => void;
  onBack?: () => void;
};

export function Welcome({ onPick, onBack }: WelcomeProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "1") {
        event.preventDefault();
        onPick("unix");
        return;
      }
      if (event.key === "2") {
        event.preventDefault();
        onPick("ide");
        return;
      }
      if (event.key === "Escape" && onBack) {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, onPick]);

  return (
    <div className="chooser">
      <header className="nav-edge">
        <p className="wordmark">{profile.user}</p>
        {onBack ? (
          <button type="button" className="chooser-back" onClick={onBack}>
            Back
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="chooser__main">
        <div className="chooser__intro">
          <h1>Pick a session.</h1>
          <p>
            {profile.fullName}, {profile.role.toLowerCase()} in{" "}
            {profile.location}. Same files either way — a Unix shell or an
            editor.
          </p>
        </div>

        <div className="sessions">
          <button
            type="button"
            className="session session--unix"
            style={{ "--i": 0 } as CSSProperties}
            onClick={() => onPick("unix")}
          >
            <span className="session__kind">tty</span>
            <span className="session__title">Unix</span>
            <p className="session__preview">
              {profile.user}@{profile.host}:~$
            </p>
            <span className="session__go">Open tty</span>
          </button>

          <button
            type="button"
            className="session session--ide"
            style={{ "--i": 1 } as CSSProperties}
            onClick={() => onPick("ide")}
          >
            <span className="session__kind">workspace</span>
            <span className="session__title">Editor</span>
            <p className="session__preview">explorer · search · git · tabs</p>
            <span className="session__go">Open editor</span>
          </button>
        </div>

        <p className="chooser-hint">1 unix · 2 editor{onBack ? " · Esc back" : ""}</p>
      </main>

      <footer className="foot-stmt">
        <p className="foot-stmt__line">Same record. Two ways in.</p>
        <div className="foot-stmt__meta">
          <span>{profile.handle}</span>
          <span>
            <a href={profile.github} rel="noreferrer" target="_blank">
              GitHub
            </a>
            {" · "}
            {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
