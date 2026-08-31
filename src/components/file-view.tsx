import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  about,
  childrenOf,
  credentials,
  experience,
  findEntry,
  profile,
  projects,
  skills,
  type Project,
} from "@/lib/content";
import { HelloType } from "@/components/hello-type";
import { headingAnchor } from "@/lib/ide";
import { projectByFilename } from "@/lib/shell";

export type FileSkin = "unix" | "ide";

type FileViewProps = {
  path: string;
  onOpen: (path: string) => void;
  onCopyEmail: () => void;
  copied: boolean;
  skin?: FileSkin;
};

export function FileView({
  path,
  onOpen,
  onCopyEmail,
  copied,
  skin = "unix",
}: FileViewProps) {
  const entry = findEntry(path);
  const name = path.split("/").pop() ?? path;

  if (entry?.kind === "dir") {
    return <DirList path={path} onOpen={onOpen} skin={skin} />;
  }

  if (name === "README.md") {
    return <Readme onOpen={onOpen} skin={skin} />;
  }
  if (name === "about.md") {
    return <About />;
  }
  if (name === "experience.log") {
    return <Experience />;
  }
  if (name === "skills.txt") {
    return <Skills />;
  }
  if (name === "contact.sh") {
    return (
      <Contact skin={skin} onCopyEmail={onCopyEmail} copied={copied} />
    );
  }
  const project = projectByFilename(name);
  if (project) {
    return <ProjectView project={project} />;
  }
  return (
    <p className="dim">
      {skin === "ide" ? `${name} is empty.` : `cat: ${name}: empty inode`}
    </p>
  );
}

function DirList({
  path,
  onOpen,
  skin,
}: {
  path: string;
  onOpen: (target: string) => void;
  skin: FileSkin;
}) {
  const kids = childrenOf(path);
  const name = path.split("/").pop() ?? path;
  const folder = skin === "ide";
  return (
    <article className="doc" id="file">
      <h1>{folder ? name : `${name}/`}</h1>
      <ul className="index">
        {kids.map((kid) => (
          <li key={kid.path}>
            <button
              type="button"
              className="index-link"
              onClick={() => onOpen(kid.path)}
            >
              {kid.kind === "dir" && !folder ? `${kid.name}/` : kid.name}
            </button>
            <span className="dim">{kid.kind === "dir" ? "directory" : "file"}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Readme({
  onOpen,
  skin,
}: {
  onOpen: (path: string) => void;
  skin: FileSkin;
}) {
  const tree = [
    { file: "about.md", open: "about.md", gloss: "who this is" },
    { file: "experience.log", open: "experience.log", gloss: "jobs, school, certs" },
    {
      file: skin === "ide" ? "projects" : "projects/",
      open: "projects",
      gloss: `${projects.length} public repos`,
    },
    { file: "skills.txt", open: "skills.txt", gloss: "languages and tools from work" },
    { file: "contact.sh", open: "contact.sh", gloss: "mail, GitHub, LinkedIn" },
  ] as const;

  return (
    <article className="doc letter" id="readme">
      <p className="letter-when">
        {profile.location} · 2026
      </p>
      <HelloType />
      <p>
        This directory is the site. Unix shell or editor — same files either
        way. The tree is the portfolio.
      </p>
      <p>
        Junior software engineer in Bekasi. Web most days — TypeScript, Next.js,
        NestJS, PostgreSQL. Workshop days, Python, PowerShell, and Siemens PLCs.
        SMKN 1 Kota Bekasi, 2025. Recent work: a manufacturing execution system
        at CV. Mesin Ngebut Canggih, diagnostics at Kemendikdasmen, and NimeList
        at PT Bangun Kreatif Abadi.
      </p>
      <p>
        Open to full-time or freelance in web, backend, or automation.
      </p>
      <p className="letter-rule" aria-hidden="true">
        * * *
      </p>
      <p className="letter-ps" id="readme-index">
        P.S. The longer cut lives in the tree.
      </p>
      <ul className="index letter-index">
        {tree.map((row) => (
          <li key={row.open}>
            <button
              type="button"
              className="index-link"
              onClick={() => onOpen(row.open)}
            >
              {row.file}
            </button>
            <span className="dim">{row.gloss}</span>
          </li>
        ))}
      </ul>
      <footer className="letter-sign">
        <Image
          src={profile.avatar}
          alt=""
          width={40}
          height={40}
          className="avatar"
        />
        <div className="letter-sign-meta">
          <p>{profile.fullName}</p>
          <p className="dim">{profile.role}</p>
        </div>
      </footer>
    </article>
  );
}

function About() {
  return (
    <article className="doc" id="about">
      <header className="doc-head">
        <Image
          src={profile.avatar}
          alt=""
          width={72}
          height={72}
          className="avatar"
        />
        <div>
          <h1>{profile.fullName}</h1>
          <p className="dim">
            {profile.role} · {profile.location}
          </p>
        </div>
      </header>
      {about.map((para) => (
        <p key={para}>{para}</p>
      ))}
      <p>
        Public code ships as{" "}
        <a href={profile.github} rel="noreferrer" target="_blank">
          {profile.handle}
        </a>
        . Repos live in <span className="path">~/fadlan/projects</span>.
      </p>
    </article>
  );
}

function Experience() {
  return (
    <article className="doc" id="experience">
      <h1>experience.log</h1>
      <ol className="log">
        {experience.map((row) => (
          <li key={row.title} id={headingAnchor("job", row.title)}>
            <span className="log-when">{row.when}</span>
            <div>
              <h2>{row.title}</h2>
              <p className="log-org">{row.org}</p>
              <p>{row.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="dim hint" id="credentials">
        certs & school
      </p>
      <ol className="log">
        {credentials.map((row) => (
          <li key={row.title}>
            <span className="log-when">{row.when}</span>
            <div>
              <h2>{row.title}</h2>
              <p className="log-org">{row.org}</p>
              <p>{row.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="dim hint">
        Live profile:{" "}
        <a href={profile.linkedin} rel="noreferrer" target="_blank">
          linkedin.com/in/fadlanhamsyari
        </a>
      </p>
    </article>
  );
}

function Skills() {
  return (
    <article className="doc" id="skills">
      <h1>skills.txt</h1>
      <p className="dim">
        From the CV and shipped work — not a self-score.
      </p>
      <ul className="skills">
        {skills.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </article>
  );
}

function Contact({
  skin,
  onCopyEmail,
  copied,
}: {
  skin: FileSkin;
  onCopyEmail: () => void;
  copied: boolean;
}) {
  if (skin === "ide") {
    return (
      <article className="doc" id="contact">
        <h1>Contact</h1>
        <dl className="spec">
          <div>
            <dt>name</dt>
            <dd>{profile.fullName}</dd>
          </div>
          <div>
            <dt>email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>github</dt>
            <dd>
              <a href={profile.github} target="_blank" rel="noreferrer">
                {profile.github.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>linkedin</dt>
            <dd>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                {profile.linkedin.replace("https://", "")}
              </a>
            </dd>
          </div>
        </dl>
        <div className="contact-row">
          <Button
            type="button"
            variant="outline"
            className="cmd"
            onClick={onCopyEmail}
            data-state={copied ? "success" : undefined}
          >
            {copied ? "Copied" : "Copy email"}
          </Button>
          <a className="cmd-link" href={`mailto:${profile.email}`}>
            Email
          </a>
          <a
            className="cmd-link"
            href={profile.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="cmd-link"
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="doc">
      <h1>contact.sh</h1>
      <pre className="env">
        <code>
          {`#!/usr/bin/env bash
NAME=${profile.fullName}
MAIL=${profile.email}
GH=${profile.github}
LI=${profile.linkedin}
`}
        </code>
      </pre>
      <div className="contact-row">
        <Button
          type="button"
          variant="outline"
          className="cmd"
          onClick={onCopyEmail}
          data-state={copied ? "success" : undefined}
        >
          {copied ? "[ copied ]" : "[ copy mail ]"}
        </Button>
        <a className="cmd-link" href={`mailto:${profile.email}`}>
          [ mailto ]
        </a>
        <a
          className="cmd-link"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
        >
          [ github ]
        </a>
        <a
          className="cmd-link"
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          [ linkedin ]
        </a>
      </div>
    </article>
  );
}

function ProjectView({ project }: { project: Project }) {
  return (
    <article className="doc" id={`project-${project.id}`}>
      <h1>{project.name}</h1>
      <p>{project.blurb}</p>
      <dl className="spec" id={`project-${project.id}-stack`}>
        <div>
          <dt>language</dt>
          <dd>{project.language}</dd>
        </div>
        <div>
          <dt>stack</dt>
          <dd>{project.stack.join(" · ")}</dd>
        </div>
        <div>
          <dt>repo</dt>
          <dd>
            <a href={project.repo} target="_blank" rel="noreferrer">
              {project.repo.replace("https://", "")}
            </a>
          </dd>
        </div>
        {project.demo ? (
          <div>
            <dt>demo</dt>
            <dd>
              <a href={project.demo} target="_blank" rel="noreferrer">
                {project.demo.replace("https://", "")}
              </a>
            </dd>
          </div>
        ) : null}
        {project.note ? (
          <div>
            <dt>note</dt>
            <dd>{project.note}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
