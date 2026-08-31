# Fadlan Hamsyari — portfolio

Unix-flavoured personal site for **Fadlan Hamsyari Priyanto**, software engineer in Bekasi. The page is a small shell: file tree, open buffer, and a prompt that understands `help`, `ls`, `cat`, `open`, and a few other commands.

Public facts come from [GitHub/Rcikaym](https://github.com/Rcikaym) and a public note about the Zavora-Life role. LinkedIn (`linkedin.com/in/fadlanhamsyari`) is linked but was not readable while this was built, so the experience log does not invent extra jobs.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

```bash
npm run check   # command parser self-check
npm run lint
npm run build
```

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui primitives, Hallmark Terminal tokens (JetBrains Mono, phosphor on near-black).

## Prompt cheatsheet

| command | what it does |
| --- | --- |
| `help` | command list |
| `ls -l` | long listing of the current directory |
| `cat about.md` | open a file in the editor |
| `cd projects` | move into `~/fadlan/projects` |
| `open github` | GitHub profile in a new tab |
| `mail` | copy `fdlnh12@gmail.com` |
| `clear` | wipe scrollback |

Tab completes commands and filenames. Up/down walks history.
