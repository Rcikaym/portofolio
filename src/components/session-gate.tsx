"use client";

import { useCallback, useSyncExternalStore } from "react";
import { BootGate } from "@/components/boot-intro";
import { IdeWorkspace } from "@/components/ide-workspace";
import { Welcome } from "@/components/welcome";
import { Workspace } from "@/components/workspace";
import {
  applyDocumentTheme,
  readStoredSession,
  resolveSessionView,
  writeStoredSession,
  type SessionId,
  type SessionView,
} from "@/lib/session";

let current: SessionView | "unknown" = "unknown";
let fromWorkspace = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function hydrateFromLocation() {
  if (current !== "unknown") return;
  current = resolveSessionView(window.location.search, readStoredSession());
  applyDocumentTheme(current);
  if (current === "unix" || current === "ide") writeStoredSession(current);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (current === "unknown") {
    queueMicrotask(() => {
      hydrateFromLocation();
      emit();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SessionView | "unknown" {
  return current;
}

function getServerSnapshot(): SessionView | "unknown" {
  return "unknown";
}

function commit(next: SessionView, persist: boolean) {
  fromWorkspace = next === "chooser" && !persist;
  current = next;
  applyDocumentTheme(next);
  if (persist && (next === "unix" || next === "ide")) writeStoredSession(next);
  emit();
}

export function SessionGate() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const pick = useCallback((id: SessionId) => {
    commit(id, true);
  }, []);

  const toChooser = useCallback(() => {
    commit("chooser", false);
  }, []);

  const back = useCallback(() => {
    const stored = readStoredSession();
    if (!stored) return;
    commit(stored, false);
  }, []);

  if (view === "unknown") return <BootGate />;
  if (view === "chooser") {
    return <Welcome onPick={pick} onBack={fromWorkspace ? back : undefined} />;
  }
  if (view === "ide") {
    return <IdeWorkspace onChangeSession={toChooser} />;
  }
  return <Workspace onChangeSession={toChooser} />;
}
