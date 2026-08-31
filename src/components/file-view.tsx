import type { ReactNode } from "react";
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

function Readme({
  onOpen,
  skin,
}: {
  onOpen: (path: string) => void;
  skin: FileSkin;
}) {
  return (
    <article className="doc" id="readme">
      {skin === "unix" ? (
        <PromptLine>
          {profile.user}@{profile.host} — {profile.role.toLowerCase()}.
        </PromptLine>
      ) : (
        <p className="lede">
          {profile.user} — {profile.role.toLowerCase()}.
        </p>
      )}
      <p>
        {skin === "unix"
          ? "Open a file in the tree, or type a command in the prompt below. This index is the page."
          : "Explorer, search, and source control sit on the rail. ⌘K jumps to a file."}
      </p>
      <ul className="index" id="readme-index">
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
          <span className="dim">jobs, school, certs</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("projects")}>
            {skin === "ide" ? "projects" : "projects/"}
          </button>
          <span className="dim">{projects.length} public repos</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("skills.txt")}>
            skills.txt
          </button>
          <span className="dim">languages and tools from work</span>
        </li>
        <li>
          <button type="button" className="index-link" onClick={() => onOpen("contact.sh")}>
            contact.sh
          </button>
          <span className="dim">mail, github, linkedin</span>
        </li>
      </ul>
      <p className="dim hint">
        {skin === "unix" ? (
          <>
            try: <kbd>help</kbd> · <kbd>ls -l</kbd> · <kbd>cat about.md</kbd> ·{" "}
            <kbd>open github</kbd>
          </>
        ) : (
          <>
            try: explorer · search · git · <kbd>⌘K</kbd>
          </>
        )}
      </p>
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
