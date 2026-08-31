import type { ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  childrenOf,
  experience,
  findEntry,
  profile,
  projects,
  skills,
  type Project,
} from "@/lib/content";
import { projectByFilename } from "@/lib/shell";

type FileViewProps = {
  path: string;
  onOpen: (path: string) => void;
  onCopyEmail: () => void;
  copied: boolean;
};

export function FileView({ path, onOpen, onCopyEmail, copied }: FileViewProps) {
  const entry = findEntry(path);
  const name = path.split("/").pop() ?? path;

  if (entry?.kind === "dir") {
    return <DirList path={path} onOpen={onOpen} />;
  }

  if (name === "README.md") {
    return <Readme onOpen={onOpen} />;
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
      <Contact onCopyEmail={onCopyEmail} copied={copied} />
    );
  }
  const project = projectByFilename(name);
  if (project) {
    return <ProjectView project={project} />;
  }
  return (
    <p className="dim">
      cat: {name}: empty inode
    </p>
  );
}

function DirList({
  path,
  onOpen,
}: {
  path: string;
  onOpen: (target: string) => void;
}) {
  const kids = childrenOf(path);
  const name = path.split("/").pop() ?? path;
  return (
    <article className="doc">
      <h1>{name}/</h1>
      <ul className="index">
        {kids.map((kid) => (
          <li key={kid.path}>
            <button
              type="button"
              className="index-link"
              onClick={() => onOpen(kid.path)}
            >
              {kid.kind === "dir" ? `${kid.name}/` : kid.name}
            </button>
            <span className="dim">{kid.kind === "dir" ? "directory" : "file"}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PromptLine({ children }: { children: ReactNode }) {
  return (
    <p className="lede">
      <span className="prompt" aria-hidden="true">
        {">"}
      </span>
      {children}
    </p>
  );
}

function Readme({ onOpen }: { onOpen: (path: string) => void }) {
  return (
    <article className="doc">
      <PromptLine>
        {profile.user}@{profile.host} — {profile.role.toLowerCase()}.
      </PromptLine>
      <p>
        Open a file in the tree, or type a command in the prompt below. This
        index is the page.
      </p>
      <ul className="index">
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("about.md")}>
            about.md
          </button>
          <span className="dim">who this is</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("experience.log")}>
            experience.log
          </button>
          <span className="dim">roles that can be sourced</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("projects")}>
            projects/
          </button>
          <span className="dim">{projects.length} public repos</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("skills.txt")}>
            skills.txt
          </button>
          <span className="dim">from those repos, not a wishlist</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("contact.sh")}>
            contact.sh
          </button>
          <span className="dim">mail, github, linkedin</span>
        </li>
      </ul>
      <p className="dim hint">
        try: <kbd>help</kbd> · <kbd>ls -l</kbd> · <kbd>cat about.md</kbd> ·{" "}
        <kbd>open github</kbd>
      </p>
    </article>
  );
}

function About() {
  return (
    <article className="doc">
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
      <p>
        I build web software — TypeScript on the client, Node and SQL when the
        work needs a backend. Public code ships as{" "}
        <a href={profile.github} rel="noreferrer" target="_blank">
          {profile.handle}
        </a>
        .
      </p>
      <p>
        Right now I am Technical Lead Engineer on Zavora-Life at PT Kenteng
        Songo Advistama. That title is from a public welcome in August 2026;
        LinkedIn would not load while this page was assembled, so I am not
        inventing a longer biography around it.
      </p>
      <p>
        Earlier work includes the SMKN 1 Kota Bekasi school website (RPL) and
        the five public repositories in{" "}
        <span className="path">~/fadlan/projects</span>.
      </p>
    </article>
  );
}

function Experience() {
  return (
    <article className="doc">
      <h1>experience.log</h1>
      <ol className="log">
        {experience.map((row) => (
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
        LinkedIn profile is linked from contact.sh. Anything not listed here
        was not available from public pages.
      </p>
    </article>
  );
}

function Skills() {
  return (
    <article className="doc">
      <h1>skills.txt</h1>
      <p className="dim">
        Inferred from public repositories — not a self-score.
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
  onCopyEmail,
  copied,
}: {
  onCopyEmail: () => void;
  copied: boolean;
}) {
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
    <article className="doc">
      <h1>{project.name}</h1>
      <p>{project.blurb}</p>
      <dl className="spec">
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
