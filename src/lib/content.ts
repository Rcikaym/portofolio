export const profile = {
  name: "Fadlan Hamsyari",
  fullName: "Fadlan Hamsyari Priyanto",
  handle: "Rcikaym",
  user: "fadlan",
  host: "rcikaym",
  home: "~/fadlan",
  role: "Junior software engineer",
  location: "Bekasi, Indonesia",
  email: "fdlnh12@gmail.com",
  github: "https://github.com/Rcikaym",
  linkedin: "https://www.linkedin.com/in/fadlanhamsyari",
  avatar: "https://avatars.githubusercontent.com/u/110288716?v=4",
  githubSince: "2022-07-30",
} as const;

export const about = [
  "I build web software and the automation around it — TypeScript and Python most days, Next.js / NestJS / PostgreSQL when it is a product, PowerShell and PLC talk when it is a workshop.",
  "Software Engineering graduate of SMKN 1 Kota Bekasi (2025). Current work: freelance tech lead at PT Kenteng Songo Advistama, on zavora.life, a Laravel clinical patient portal. Earlier: a Manufacturing Execution System at CV. Mesin Ngebut Canggih, a Python diagnostic tool at Kemendikdasmen that cut manual hardware inspection by about 80%, and NimeList at PT Bangun Kreatif Abadi.",
  "BNSP Junior Coder. 1st place, LKS Web Technology — Bekasi City, then the West Java provincial round. TOEIC 855/990. Open to full-time or freelance work in web, backend, or automation.",
] as const;

export type ProjectRepo = { label: string; url: string };

export type Project = {
  id: string;
  slug: string;
  filename: string;
  name: string;
  blurb: string;
  stack: string[];
  /** Primary public repo. Omitted for private client work. */
  repo?: string;
  /** Set when a project is split across repos (frontend / backend). */
  repos?: ProjectRepo[];
  demo?: string;
  site?: string;
  language: string;
  note?: string;
  /** Plain line when there is no public repo. */
  availability?: string;
};

export const projects: Project[] = [
  {
    id: "nimelist",
    slug: "nimelist",
    filename: "nimelist.md",
    name: "NimeList",
    blurb:
      "Anime, series, and movie catalog. JWT auth, sessions, payment gateway, and 15+ REST endpoints. Next.js frontend; NestJS API on PostgreSQL.",
    stack: [
      "Next.js",
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Tailwind CSS",
      "NextUI",
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
  {
    id: "jira",
    slug: "jira-wanna-be",
    filename: "jira-wanna-be.md",
    name: "jira-wanna-be",
    blurb:
      "Project and task board for a multi-discipline team. Kanban with dependency locks, role-aware actions, optimistic locking, and an audit trail. Next.js frontend; Hono API on PostgreSQL.",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "TanStack Query",
      "Hono",
      "Prisma",
      "PostgreSQL",
    ],
    repo: "https://github.com/Rcikaym/jira-wanna-be-frontend",
    repos: [
      {
        label: "Frontend",
        url: "https://github.com/Rcikaym/jira-wanna-be-frontend",
      },
      {
        label: "Backend",
        url: "https://github.com/Rcikaym/jira-wanna-be-backend",
      },
    ],
    demo: "https://jira-wanna-be-frontend.vercel.app",
    language: "TypeScript",
    note: "Fullstack assessment for NodeWave. Frontend and backend are separate repos.",
  },
];

/** Client work. Not public repos — rendered apart from `projects`. */
export const workProjects: Project[] = [
  {
    id: "zavora",
    slug: "zavora",
    filename: "zavora.md",
    name: "zavora.life, PT Kenteng Songo Advistama",
    blurb:
      "Laravel clinical patient portal. Redesigned the patient dashboard information architecture: a two-column view in place of the single-stream layout, a mobile-first bottom tab bar, and a consolidated secondary-tools hub, with a 1,400+ line clinical design-token system. Fixed a recurring Leaflet/CARTO map-resizing bug with ResizeObserver and requestAnimationFrame, kept third-party map tiles out of the PWA service worker cache, and hardened Docker Nginx/PHP upload limits for facility CSV imports. 400+ lines of PHPUnit regression tests for layout, viewport, and CSV import.",
    stack: [
      "Laravel",
      "PHP",
      "PHPUnit",
      "Leaflet",
      "PWA",
      "Docker",
      "Nginx",
      "CSS design tokens",
    ],
    site: "https://zavora.life",
    language: "PHP",
    availability: "Private repo. No public code.",
  },
  {
    id: "plc-mes",
    slug: "plc-mes",
    filename: "plc-mes.md",
    name: "PLC MES, CV. Mesin Ngebut Canggih",
    blurb:
      "A manufacturing execution system I built alone for a workshop client. Python reads Siemens S7-200 SMART PLCs over snap7; machine metrics go to TimescaleDB, and config lives in a separate event-sourced PostgreSQL store. Built for 20 to 200 machines and runs as a Docker stack on a Radxa E24C edge box.",
    stack: [
      "Python",
      "snap7",
      "Siemens S7-200 SMART",
      "PostgreSQL",
      "TimescaleDB",
      "Event sourcing",
      "Docker",
    ],
    language: "Python",
    availability: "Private client work. No public repo.",
  },
];

export const skills = [
  "TypeScript",
  "JavaScript",
  "Python",
  "PHP",
  "Go",
  "SQL",
  "Next.js",
  "React",
  "NestJS",
  "FastAPI",
  "Node.js",
  "PostgreSQL",
  "MySQL",
  "TimescaleDB",
  "Docker",
  "REST APIs",
  "PowerShell",
  "PLC (Siemens S7 / snap7)",
] as const;

export const experience = [
  {
    when: "2026",
    title: "Tech lead & full-stack software engineer (freelance)",
    org: "PT Kenteng Songo Advistama · Aug 2026–Present",
    detail:
      "Freelance tech lead on zavora.life, a Laravel clinical patient portal. Redesigned the patient dashboard: a 1,400+ line clinical design-token system, a two-column view in place of the single-stream layout, a mobile-first bottom tab bar, and a consolidated secondary-tools hub. Fixed a recurring Leaflet/CARTO map-resizing bug with ResizeObserver and requestAnimationFrame, kept third-party map tiles out of the PWA service worker cache, and hardened Docker Nginx/PHP upload limits for facility CSV imports. 400+ lines of PHPUnit regression tests for layout, viewport, and CSV import.",
    workId: "zavora",
  },
  {
    when: "2026",
    title: "Software engineer",
    org: "CV. Mesin Ngebut Canggih (MNC) · Jun–Aug 2026",
    detail:
      "Sole developer on a Manufacturing Execution System: Siemens S7-200 SMART via snap7, dual PostgreSQL (TimescaleDB metrics + event-sourced config, sized for 20–200 machines), Docker stack on a Radxa E24C.",
  },
  {
    when: "2025",
    title: "IT support (part-time)",
    org: "Kemendikdasmen — Direktorat SMP · Jul 2025–Jul 2026",
    detail:
      "Python + PowerShell tool for system diagnostics and BIOS retrieval. Sequential diagnostic launcher for hardware checks. About 80% less time on manual inspection.",
  },
  {
    when: "2024",
    title: "Full-stack developer intern",
    org: "PT Bangun Kreatif Abadi · Jul–Dec 2024",
    detail:
      "NimeList end-to-end: JWT auth, sessions, payment gateway, 15+ REST endpoints on NestJS, PostgreSQL schema, Next.js UI. Agile team, code review, merge conflicts.",
  },
] as const;

export const credentials = [
  {
    when: "2025",
    title: "1st place — LKS Web Technology, Bekasi City",
    org: "MKKS Kota Bekasi · Mar 2025",
    detail:
      "City-level student skills competition in full-stack web. Then represented Bekasi at the West Java provincial LKS (Cianjur, Jun 2025).",
  },
  {
    when: "2025",
    title: "Software Engineering (RPL)",
    org: "SMKN 1 Kota Bekasi · Jul 2022–May 2025",
    detail:
      "Full-stack web and databases. Web Technologies LKS team, IT / coding club, BNSP student delegate.",
  },
  {
    when: "2024",
    title: "Junior Coder — BNSP",
    org: "Badan Nasional Sertifikasi Profesi · Dec 2024–Dec 2027",
    detail: "National occupational certification in software development.",
  },
  {
    when: "2024",
    title: "TOEIC Listening & Reading",
    org: "855 / 990",
    detail: "English for technical and business contexts.",
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

export function projectRepoLinks(project: Project): ProjectRepo[] {
  if (project.repos && project.repos.length > 0) return project.repos;
  if (project.repo) return [{ label: "Repo", url: project.repo }];
  return [];
}

export function projectByFilename(name: string): Project | undefined {
  return (
    projects.find((p) => p.filename === name) ??
    workProjects.find((p) => p.filename === name)
  );
}

export function projectBySlug(slug: string): Project | undefined {
  return (
    projects.find((p) => p.slug === slug) ??
    workProjects.find((p) => p.slug === slug)
  );
}

export function isWorkProject(project: Project): boolean {
  return workProjects.some((row) => row.id === project.id);
}

export function projectPath(project: Project): string {
  const dir = isWorkProject(project) ? "work" : "projects";
  return `${HOME}/${dir}/${project.filename}`;
}

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
  {
    path: `${HOME}/work`,
    name: "work",
    kind: "dir",
    parent: HOME,
  },
  ...projects.map((p) => ({
    path: `${HOME}/projects/${p.filename}`,
    name: p.filename,
    kind: "file" as const,
    parent: `${HOME}/projects`,
  })),
  ...workProjects.map((p) => ({
    path: `${HOME}/work/${p.filename}`,
    name: p.filename,
    kind: "file" as const,
    parent: `${HOME}/work`,
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
