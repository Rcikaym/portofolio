export const profile = {
  name: "Fadlan Hamsyari",
  fullName: "Fadlan Hamsyari Priyanto",
  handle: "Rcikaym",
  user: "fadlan",
  host: "bekasi",
  home: "~/fadlan",
  role: "Software engineer",
  location: "Bekasi, Indonesia",
  email: "fdlnh12@gmail.com",
  github: "https://github.com/Rcikaym",
  linkedin: "https://www.linkedin.com/in/fadlanhamsyari",
  avatar: "https://avatars.githubusercontent.com/u/110288716?v=4",
  githubSince: "2022-07-30",
} as const;

export type Project = {
  id: string;
  slug: string;
  filename: string;
  name: string;
  blurb: string;
  stack: string[];
  repo: string;
  demo?: string;
  language: string;
  note?: string;
};

export const projects: Project[] = [
  {
    id: "nimelist",
    slug: "nimelist",
    filename: "nimelist.md",
    name: "NimeList",
    blurb:
      "Anime ratings, reviews, and threaded discussions. This repo is the Next.js frontend; the API is NestJS on PostgreSQL.",
    stack: [
      "Next.js 16",
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Tailwind CSS",
      "Ant Design",
    ],
    repo: "https://github.com/Rcikaym/NimeList-Frontend",
    demo: "https://nime-list-frontend.vercel.app",
    language: "TypeScript",
    note: "Built with Akbar (github.com/akbarR1dho).",
  },
  {
    id: "mom",
    slug: "mom-in-a-minute",
    filename: "mom-in-a-minute.md",
    name: "MoM-in-a-Minute",
    blurb:
      "Paste messy meeting notes. Get structured minutes: summary, decisions, action items, open questions. Edit, then copy markdown.",
    stack: ["TypeScript", "Vite", "Groq"],
    repo: "https://github.com/Rcikaym/mom-in-a-minute",
    language: "TypeScript",
  },
  {
    id: "monocraft",
    slug: "e-commerce-spa",
    filename: "monocraft.md",
    name: "Mono Craft",
    blurb:
      "Minimalist Japanese homeware store as a React SPA. Cart via Context + useReducer, mock API, no UI kit — tokens and plain CSS.",
    stack: ["React", "Vite", "react-router-dom", "CSS custom properties"],
    repo: "https://github.com/Rcikaym/e-commerce-spa",
    demo: "https://e-commerce-spa-one.vercel.app",
    language: "JavaScript",
  },
  {
    id: "launcher",
    slug: "applauncher",
    filename: "applauncher.py",
    name: "AppLauncher",
    blurb:
      "Small Python program that launches the apps Fadlan actually uses, so the task is one command instead of a hunt.",
    stack: ["Python"],
    repo: "https://github.com/Rcikaym/AppLauncher",
    language: "Python",
  },
  {
    id: "gift",
    slug: "a-gift",
    filename: "a-gift.jsx",
    name: "A-Gift",
    blurb:
      "A birthday site built in React + Vite. Personal, not a product — kept public because the craft is the point.",
    stack: ["React", "Vite"],
    repo: "https://github.com/Rcikaym/A-Gift",
    demo: "https://a-gift-sigma.vercel.app",
    language: "JavaScript",
  },
];

export const skills = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "NestJS",
  "PostgreSQL",
  "Tailwind CSS",
  "Python",
  "Vite",
] as const;

export const experience = [
  {
    when: "2026",
    title: "Technical Lead Engineer",
    org: "Zavora-Life · PT Kenteng Songo Advistama",
    detail:
      "Public welcome (Aug 2026) names Fadlan Hamsyari Priyanto as Technical Lead Engineer for Zavora-Life. LinkedIn itself would not load here, so this line is the sourced title — not a reconstructed job description.",
  },
  {
    when: "—",
    title: "Web developer (school site)",
    org: "SMKN 1 Kota Bekasi · RPL",
    detail:
      "Listed on the SMKN 1 Kota Bekasi website rebuild: interface and features, Software Engineering (RPL) track.",
  },
] as const;

export type FsEntry = {
  path: string;
  name: string;
  kind: "file" | "dir";
  parent: string;
  listing?: string;
};

export const HOME = "~/fadlan";

export const fsEntries: FsEntry[] = [
  { path: HOME, name: "fadlan", kind: "dir", parent: "~" },
  {
    path: `${HOME}/README.md`,
    name: "README.md",
    kind: "file",
    parent: HOME,
  },
  {
    path: `${HOME}/about.md`,
    name: "about.md",
    kind: "file",
    parent: HOME,
  },
  {
    path: `${HOME}/experience.log`,
    name: "experience.log",
    kind: "file",
    parent: HOME,
  },
  {
    path: `${HOME}/skills.txt`,
    name: "skills.txt",
    kind: "file",
    parent: HOME,
  },
  {
    path: `${HOME}/contact.sh`,
    name: "contact.sh",
    kind: "file",
    parent: HOME,
  },
  {
    path: `${HOME}/projects`,
    name: "projects",
    kind: "dir",
    parent: HOME,
  },
  ...projects.map((p) => ({
    path: `${HOME}/projects/${p.filename}`,
    name: p.filename,
    kind: "file" as const,
    parent: `${HOME}/projects`,
  })),
];

export const DEFAULT_FILE = `${HOME}/README.md`;

export function findEntry(path: string): FsEntry | undefined {
  const normalised = normalisePath(path);
  return fsEntries.find((e) => e.path === normalised);
}

export function childrenOf(dir: string): FsEntry[] {
  const normalised = normalisePath(dir);
  return fsEntries.filter((e) => e.parent === normalised);
}

export function normalisePath(input: string, cwd = HOME): string {
  let path = input.trim();
  if (path === "" || path === ".") return cwd;
  if (path === "~") return HOME;
  if (path === "~/" || path === "~/fadlan/") return HOME;
  if (path.startsWith("~/")) {
    path = path === "~/fadlan" || path.startsWith("~/fadlan/")
      ? path.replace(/^~/, "~")
      : `${HOME}/${path.slice(2)}`;
  } else if (path.startsWith("/")) {
    path = `${HOME}${path}`;
  } else {
    path = `${cwd.replace(/\/$/, "")}/${path}`;
  }
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  if (parts.length === 0) return HOME;
  if (parts[0] === "~" && parts[1] === "fadlan") {
    return parts.join("/");
  }
  if (parts[0] === "~") {
    return [HOME, ...parts.slice(1)].join("/");
  }
  return parts.join("/");
}

export const COMMANDS = [
  "help",
  "ls",
  "cat",
  "cd",
  "pwd",
  "open",
  "whoami",
  "tree",
  "clear",
  "skills",
  "contact",
  "github",
  "linkedin",
  "mail",
  "date",
  "uname",
  "man",
] as const;

export type CommandName = (typeof COMMANDS)[number];
