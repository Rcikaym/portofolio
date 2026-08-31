"use client";

import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { childrenOf, HOME, type FsEntry } from "@/lib/content";

export function FileTree({
  openPath,
  onOpen,
  skin = "unix",
}: {
  openPath: string;
  onOpen: (path: string) => void;
  skin?: "unix" | "ide";
}) {
  if (skin === "ide") {
    return <IdeExplorer openPath={openPath} onOpen={onOpen} />;
  }

  return (
    <nav aria-label="Home directory">
      <p className="tree-label">{HOME}/</p>
      <ul>
        {childrenOf(HOME).map((entry) => (
          <TreeRow
            key={entry.path}
            entry={entry}
            openPath={openPath}
            onOpen={onOpen}
            skin={skin}
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
            onOpen={onOpen}
            skin={skin}
          />
        ))}
      </ul>
    </nav>
  );
}

function TreeRow({
  entry,
  openPath,
  onOpen,
  skin,
}: {
  entry: FsEntry;
  openPath: string;
  onOpen: (path: string) => void;
  skin: "unix" | "ide";
}) {
  const current = openPath === entry.path;
  const slash = skin === "unix" && entry.kind === "dir" ? "/" : "";
  return (
    <li>
      <button
        type="button"
        className="tree-item"
        aria-current={current ? "true" : undefined}
        onClick={() => onOpen(entry.path)}
      >
        {skin === "unix" ? (
          <span className="tree-kind" aria-hidden="true">
            {entry.kind === "dir" ? "d" : "-"}
          </span>
        ) : null}
        {entry.name}
        {slash}
      </button>
    </li>
  );
}

function IdeExplorer({
  openPath,
  onOpen,
}: {
  openPath: string;
  onOpen: (path: string) => void;
}) {
  const [openDirs, setOpenDirs] = useState(() => new Set([HOME, `${HOME}/projects`]));

  const toggle = (path: string) => {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <nav aria-label="Explorer">
      <ul className="ide-tree">
        <IdeDir
          path={HOME}
          openPath={openPath}
          openDirs={openDirs}
          depth={0}
          onOpen={onOpen}
          onToggle={toggle}
        />
      </ul>
    </nav>
  );
}

function IdeDir({
  path,
  openPath,
  openDirs,
  depth,
  onOpen,
  onToggle,
}: {
  path: string;
  openPath: string;
  openDirs: Set<string>;
  depth: number;
  onOpen: (path: string) => void;
  onToggle: (path: string) => void;
}) {
  const expanded = openDirs.has(path);
  const current = openPath === path;
  const label = path === HOME ? "fadlan" : (path.split("/").pop() ?? path);
  const kids = childrenOf(path);

  return (
    <li>
      <div
        className="ide-tree-row"
        style={{ "--depth": depth } as CSSProperties}
      >
        <button
          type="button"
          className="ide-tree-chevron"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={() => onToggle(path)}
        >
          {expanded ? (
            <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="tree-item ide-tree-name"
          aria-current={current ? "true" : undefined}
          onClick={() => {
            onOpen(path);
            if (!expanded) onToggle(path);
          }}
        >
          {label}
        </button>
      </div>
      {expanded ? (
        <ul>
          {kids.map((entry) =>
            entry.kind === "dir" ? (
              <IdeDir
                key={entry.path}
                path={entry.path}
                openPath={openPath}
                openDirs={openDirs}
                depth={depth + 1}
                onOpen={onOpen}
                onToggle={onToggle}
              />
            ) : (
              <IdeFile
                key={entry.path}
                entry={entry}
                openPath={openPath}
                depth={depth + 1}
                onOpen={onOpen}
              />
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}

function IdeFile({
  entry,
  openPath,
  depth,
  onOpen,
}: {
  entry: FsEntry;
  openPath: string;
  depth: number;
  onOpen: (path: string) => void;
}) {
  const current = openPath === entry.path;
  return (
    <li>
      <div
        className="ide-tree-row"
        style={{ "--depth": depth } as CSSProperties}
      >
        <span className="ide-tree-chevron" aria-hidden="true" />
        <button
          type="button"
          className="tree-item ide-tree-name"
          aria-current={current ? "true" : undefined}
          onClick={() => onOpen(entry.path)}
        >
          {entry.name}
        </button>
      </div>
    </li>
  );
}
