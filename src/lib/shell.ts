import {
  COMMANDS,
  DEFAULT_FILE,
  HOME,
  childrenOf,
  findEntry,
  normalisePath,
  profile,
  projects,
  skills,
  type CommandName,
} from "./content";

export type ShellAction =
  | { type: "print"; lines: string[]; tone?: "ok" | "err" | "dim" }
  | { type: "open"; path: string; lines?: string[] }
  | { type: "cwd"; path: string; lines?: string[] }
  | { type: "clear" }
  | { type: "href"; url: string; lines: string[] };

export type ShellResult = {
  actions: ShellAction[];
  error?: string;
};

export type ShellState = {
  cwd: string;
};

const HELP: string[] = [
  "fadlan(1)                   portfolio shell                   fadlan(1)",
  "",
  "COMMANDS",
  "  help                 this page",
  "  ls [path]            list files  (−l for long)",
  "  cat <file>           open a file in the editor",
  "  cd <dir>             change directory",
  "  pwd                  print working directory",
  "  tree                 print the home tree",
  "  open <file|url>      open a file, or github / linkedin / mail",
  "  whoami               name, role, place",
  "  skills               languages and tools",
  "  contact              email and profiles",
  "  github | linkedin    open those URLs",
  "  mail                 copy the inbox address",
  "  clear                wipe the scrollback",
  "  date | uname | man   small unix extras",
  "",
  "KEYS",
  "  Ctrl-`  Cmd-`        show or hide this prompt",
  "",
  "Files live under ~/fadlan. Tab completes commands and paths.",
];

function unknown(cmd: string): ShellResult {
  return {
    error: `command not found: ${cmd}`,
    actions: [
      {
        type: "print",
        tone: "err",
        lines: [
          `fadlan: ${cmd}: command not found`,
          "type  help  for the command list",
        ],
      },
    ],
  };
}

function usage(cmd: string, hint: string): ShellResult {
  return {
    error: hint,
    actions: [
      {
        type: "print",
        tone: "err",
        lines: [`${cmd}: ${hint}`],
      },
    ],
  };
}

function listDir(path: string, long: boolean): string[] {
  const entry = findEntry(path);
  if (!entry) return [];
  const rows =
    entry.kind === "dir"
      ? childrenOf(path)
      : [entry];
  if (!long) {
    return rows.map((e) => (e.kind === "dir" ? `${e.name}/` : e.name));
  }
  return rows.map((e) => {
    const mode = e.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
    const nlink = e.kind === "dir" ? String(childrenOf(e.path).length) : "1";
    const name = e.kind === "dir" ? `${e.name}/` : e.name;
    return `${mode}  ${nlink.padStart(2, " ")}  ${profile.user}  staff  ${name}`;
  });
}

function treeLines(dir: string, prefix = ""): string[] {
  const kids = childrenOf(dir);
  const lines: string[] = [];
  kids.forEach((kid, i) => {
    const last = i === kids.length - 1;
    const branch = last ? "└─ " : "├─ ";
    const label = kid.kind === "dir" ? `${kid.name}/` : kid.name;
    lines.push(`${prefix}${branch}${label}`);
    if (kid.kind === "dir") {
      lines.push(...treeLines(kid.path, `${prefix}${last ? "   " : "│  "}`));
    }
  });
  return lines;
}

function resolveOpenTarget(
  raw: string,
  cwd: string,
): { path?: string; url?: string; mail?: boolean } {
  const token = raw.trim().toLowerCase();
  if (token === "github" || token === "gh") return { url: profile.github };
  if (token === "linkedin") return { url: profile.linkedin };
  if (token === "mail" || token === "email" || token === "inbox") {
    return { mail: true };
  }
  if (token.startsWith("http://") || token.startsWith("https://")) {
    return { url: raw.trim() };
  }
  const path = normalisePath(raw, cwd);
  if (findEntry(path)) return { path };
  return {};
}

export function parseCommand(input: string, state: ShellState): ShellResult {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (trimmed === "") {
    return { actions: [] };
  }

  const argv = splitArgs(trimmed);
  const cmd = argv[0]?.toLowerCase() as string;
  const args = argv.slice(1);

  if (cmd === "help" || cmd === "?" || (cmd === "man" && !args[0])) {
    return { actions: [{ type: "print", lines: HELP }] };
  }

  if (cmd === "man") {
    const topic = args[0]?.toLowerCase();
    if (topic === "fadlan" || topic === profile.handle.toLowerCase()) {
      return {
        actions: [
          {
            type: "print",
            lines: [
              "FADLAN(1)",
              "",
              `${profile.fullName}  —  ${profile.role}, ${profile.location}.`,
              `Public code: ${profile.handle} on GitHub.`,
              "See about.md and experience.log.",
            ],
          },
        ],
      };
    }
    return usage("man", `no manual entry for ${args[0]}`);
  }

  if (cmd === "pwd") {
    return {
      actions: [{ type: "print", lines: [state.cwd] }],
    };
  }

  if (cmd === "whoami") {
    return {
      actions: [
        {
          type: "print",
          lines: [
            `${profile.user}`,
            `${profile.fullName}  <${profile.email}>`,
            `${profile.role}  ·  ${profile.location}`,
            `github  ${profile.handle}`,
          ],
        },
      ],
    };
  }

  if (cmd === "date") {
    return {
      actions: [
        {
          type: "print",
          lines: [new Date().toUTCString()],
        },
      ],
    };
  }

  if (cmd === "uname") {
    return {
      actions: [
        {
          type: "print",
          lines: ["FadlanOS 1.0  ~  unix-flavoured portfolio  x86_64"],
        },
      ],
    };
  }

  if (cmd === "clear") {
    return { actions: [{ type: "clear" }] };
  }

  if (cmd === "skills") {
    return {
      actions: [
        {
          type: "open",
          path: `${HOME}/skills.txt`,
          lines: [...skills],
        },
      ],
    };
  }

  if (cmd === "contact") {
    return {
      actions: [
        {
          type: "open",
          path: `${HOME}/contact.sh`,
        },
      ],
    };
  }

  if (cmd === "github" || cmd === "gh") {
    return {
      actions: [
        {
          type: "href",
          url: profile.github,
          lines: [`opening  ${profile.github}`],
        },
      ],
    };
  }

  if (cmd === "linkedin") {
    return {
      actions: [
        {
          type: "href",
          url: profile.linkedin,
          lines: [`opening  ${profile.linkedin}`],
        },
      ],
    };
  }

  if (cmd === "mail" || cmd === "email") {
    return {
      actions: [
        {
          type: "print",
          tone: "ok",
          lines: [`MAILTO=${profile.email}`],
        },
      ],
    };
  }

  if (cmd === "tree") {
    return {
      actions: [
        {
          type: "print",
          lines: [`${HOME}/`, ...treeLines(HOME)],
        },
      ],
    };
  }

  if (cmd === "ls") {
    const flags = args.filter((a) => a.startsWith("-")).join("");
    const long = flags.includes("l");
    const pathArg = args.find((a) => !a.startsWith("-"));
    const target = normalisePath(pathArg ?? ".", state.cwd);
    const entry = findEntry(target);
    if (!entry) {
      return usage("ls", `${pathArg ?? target}: no such file or directory`);
    }
    return {
      actions: [{ type: "print", lines: listDir(target, long) }],
    };
  }

  if (cmd === "cd") {
    const target = normalisePath(args[0] ?? HOME, state.cwd);
    const entry = findEntry(target);
    if (!entry) {
      return usage("cd", `${args[0] ?? target}: no such file or directory`);
    }
    if (entry.kind !== "dir") {
      return usage("cd", `${entry.name}: not a directory`);
    }
    return {
      actions: [{ type: "cwd", path: entry.path }],
    };
  }

  if (cmd === "cat" || cmd === "less" || cmd === "more") {
    if (!args[0]) {
      return usage(cmd, "missing file operand");
    }
    const target = normalisePath(args[0], state.cwd);
    const entry = findEntry(target);
    if (!entry) {
      return usage(cmd, `${args[0]}: no such file or directory`);
    }
    if (entry.kind === "dir") {
      return usage(cmd, `${entry.name}: is a directory`);
    }
    return {
      actions: [{ type: "open", path: entry.path }],
    };
  }

  if (cmd === "open") {
    if (!args[0]) {
      return usage("open", "missing file or url");
    }
    const resolved = resolveOpenTarget(args[0], state.cwd);
    if (resolved.mail) {
      return {
        actions: [
          {
            type: "print",
            tone: "ok",
            lines: [`MAILTO=${profile.email}`],
          },
        ],
      };
    }
    if (resolved.url) {
      return {
        actions: [
          {
            type: "href",
            url: resolved.url,
            lines: [`opening  ${resolved.url}`],
          },
        ],
      };
    }
    if (resolved.path) {
      const entry = findEntry(resolved.path);
      if (entry?.kind === "dir") {
        return {
          actions: [{ type: "cwd", path: entry.path, lines: listDir(entry.path, false) }],
        };
      }
      return {
        actions: [{ type: "open", path: resolved.path }],
      };
    }
    return usage("open", `${args[0]}: nothing to open`);
  }

  return unknown(cmd);
}

export function splitArgs(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === " ") {
      if (cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function complete(input: string, cwd: string): string {
  const hasTrailSpace = /\s$/.test(input);
  const argv = splitArgs(input.trim());
  if (argv.length === 0) return input;

  if (argv.length === 1 && !hasTrailSpace) {
    const hits = COMMANDS.filter((c) => c.startsWith(argv[0].toLowerCase()));
    if (hits.length === 1) return `${hits[0]} `;
    return input;
  }

  const prefix = argv[argv.length - 1] ?? "";
  const names = childrenOf(cwd).map((e) =>
    e.kind === "dir" ? `${e.name}/` : e.name,
  );
  const hits = names.filter((n) => n.startsWith(prefix));
  if (hits.length === 1) {
    const next = [...argv.slice(0, -1), hits[0]].join(" ");
    return hits[0].endsWith("/") ? next : `${next} `;
  }
  return input;
}

export function defaultOpen(): string {
  return DEFAULT_FILE;
}

export function isCommand(name: string): name is CommandName {
  return (COMMANDS as readonly string[]).includes(name);
}

export function projectByFilename(name: string) {
  return projects.find((p) => p.filename === name);
}
