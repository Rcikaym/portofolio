import {
  HOME,
  about,
  childrenOf,
  credentials,
  experience,
  findEntry,
  normalisePath,
  profile,
  projects,
  skills,
} from "./content";

export type IdePanel = "files" | "search" | "git" | "outline";

export const IDE_PANELS: { id: IdePanel; label: string }[] = [
  { id: "files", label: "Explorer" },
  { id: "search", label: "Search" },
  { id: "git", label: "Source Control" },
  { id: "outline", label: "Outline" },
];

export type SearchHit = {
  path: string;
  name: string;
  excerpt: string;
};

export type OutlineRow = {
  id: string;
  label: string;
};

export type ScmRepo = {
  name: string;
  path: string;
  url: string;
  language: string;
};

type CorpusRow = {
  path: string;
  name: string;
  text: string;
};

function corpus(): CorpusRow[] {
  return [
    {
      path: `${HOME}/README.md`,
      name: "README.md",
      text: [
        profile.fullName,
        profile.role,
        profile.location,
        profile.handle,
        ...about,
      ].join(" "),
    },
    {
      path: `${HOME}/about.md`,
      name: "about.md",
      text: [profile.fullName, profile.role, ...about].join(" "),
    },
    {
      path: `${HOME}/experience.log`,
      name: "experience.log",
      text: [...experience, ...credentials]
        .map((row) => `${row.when} ${row.title} ${row.org} ${row.detail}`)
        .join(" "),
    },
    {
      path: `${HOME}/skills.txt`,
      name: "skills.txt",
      text: skills.join(" "),
    },
    {
      path: `${HOME}/contact.sh`,
      name: "contact.sh",
      text: [profile.fullName, profile.email, profile.github, profile.linkedin].join(
        " ",
      ),
    },
    ...projects.map((project) => ({
      path: `${HOME}/projects/${project.filename}`,
      name: project.filename,
      text: [
        project.name,
        project.blurb,
        project.language,
        ...project.stack,
        project.note ?? "",
      ].join(" "),
    })),
  ];
}

export function excerptAround(text: string, query: string, width = 88): string {
  const q = query.trim();
  if (!q) return text.slice(0, width);
  const lower = text.toLowerCase();
  const at = lower.indexOf(q.toLowerCase());
  if (at < 0) {
    const clipped = text.slice(0, width).trimEnd();
    return text.length > width ? `${clipped}…` : clipped;
  }
  const start = Math.max(0, at - 28);
  const end = Math.min(text.length, at + q.length + 48);
  const slice = text.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
}

export function searchWorkspace(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return corpus()
    .map((row) => {
      const inName = row.name.toLowerCase().includes(q);
      const inText = row.text.toLowerCase().includes(q);
      if (!inName && !inText) return null;
      return {
        path: row.path,
        name: row.name,
        excerpt: inText ? excerptAround(row.text, query) : row.path.replace(HOME, "~"),
      };
    })
    .filter((hit): hit is SearchHit => hit !== null);
}

export function languageFor(path: string): string {
  const entry = findEntry(path);
  if (entry?.kind === "dir") return "Folder";
  const name = path.split("/").pop() ?? "";
  if (name.endsWith(".md")) return "Markdown";
  if (name.endsWith(".log")) return "Log";
  if (name.endsWith(".txt")) return "Plain Text";
  if (name.endsWith(".sh")) return "Shell";
  if (name.endsWith(".py")) return "Python";
  if (name.endsWith(".jsx")) return "JavaScript";
  return "Plain Text";
}

export function crumbs(path: string): { label: string; path: string }[] {
  const p = normalisePath(path);
  const root = [{ label: "fadlan", path: HOME }];
  if (p === HOME) return root;
  const rest = p.startsWith(`${HOME}/`) ? p.slice(HOME.length + 1) : p;
  let acc = HOME;
  const out = [...root];
  for (const bit of rest.split("/")) {
    if (!bit) continue;
    acc = `${acc}/${bit}`;
    out.push({ label: bit, path: acc });
  }
  return out;
}

export function tabLabel(path: string): string {
  if (path === HOME) return "fadlan";
  return path.split("/").pop() ?? path;
}

export function headingAnchor(prefix: string, title: string): string {
  return `${prefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function outlineFor(path: string): OutlineRow[] {
  const p = normalisePath(path);
  const entry = findEntry(p);
  if (entry?.kind === "dir") {
    return childrenOf(p).map((child) => ({
      id: child.path,
      label: child.name,
    }));
  }
  const name = p.split("/").pop() ?? "";
  if (name === "README.md") {
    return [
      { id: "readme", label: "README.md" },
      { id: "readme-index", label: "Index" },
    ];
  }
  if (name === "about.md") {
    return [{ id: "about", label: profile.fullName }];
  }
  if (name === "experience.log") {
    return [
      { id: "experience", label: "experience.log" },
      ...experience.map((row) => ({
        id: headingAnchor("job", row.title),
        label: row.title,
      })),
      { id: "credentials", label: "Certs and school" },
    ];
  }
  if (name === "skills.txt") {
    return [{ id: "skills", label: "skills.txt" }];
  }
  if (name === "contact.sh") {
    return [{ id: "contact", label: "Contact" }];
  }
  const project = projects.find((row) => row.filename === name);
  if (project) {
    return [
      { id: `project-${project.id}`, label: project.name },
      { id: `project-${project.id}-stack`, label: "Stack" },
    ];
  }
  return [{ id: "file", label: name }];
}

export function scmRemote(): { host: string; url: string; since: string } {
  return {
    host: "github.com/Rcikaym",
    url: profile.github,
    since: profile.githubSince,
  };
}

export function scmPublished(): ScmRepo[] {
  return projects.map((project) => ({
    name: project.name,
    path: `${HOME}/projects/${project.filename}`,
    url: project.repo,
    language: project.language,
  }));
}

export function panelTitle(panel: IdePanel): string {
  return IDE_PANELS.find((row) => row.id === panel)?.label ?? panel;
}

export function nextTab(tabs: string[], closing: string, current: string): string {
  if (tabs.length <= 1) return `${HOME}/README.md`;
  const i = tabs.indexOf(closing);
  const remain = tabs.filter((tab) => tab !== closing);
  if (current !== closing) return current;
  return remain[Math.max(0, i - 1)] ?? remain[0] ?? `${HOME}/README.md`;
}
