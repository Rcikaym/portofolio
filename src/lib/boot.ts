import { profile } from "./content";

export const BOOT_STORAGE_KEY = "rcikaym-boot";

/** patorjk ANSI Shadow, stacked so each word fits a phone width. */
export const ASCII_RCIKAYM = `██████╗  ██████╗██╗██╗  ██╗ █████╗ ██╗   ██╗███╗   ███╗
██╔══██╗██╔════╝██║██║ ██╔╝██╔══██╗╚██╗ ██╔╝████╗ ████║
██████╔╝██║     ██║█████╔╝ ███████║ ╚████╔╝ ██╔████╔██║
██╔══██╗██║     ██║██╔═██╗ ██╔══██║  ╚██╔╝  ██║╚██╔╝██║
██║  ██║╚██████╗██║██║  ██╗██║  ██║   ██║   ██║ ╚═╝ ██║
╚═╝  ╚═╝ ╚═════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝`;

export const ASCII_PORTO = `██████╗  ██████╗ ██████╗ ████████╗ ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔═══██╗
██████╔╝██║   ██║██████╔╝   ██║   ██║   ██║
██╔═══╝ ██║   ██║██╔══██╗   ██║   ██║   ██║
██║     ╚██████╔╝██║  ██║   ██║   ╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ `;

export const ASCII_BANNER = [
  { id: "rcikaym", art: ASCII_RCIKAYM },
  { id: "porto", art: ASCII_PORTO },
] as const;

export const BOOT_FETCHES = [
  "next@16.3.3",
  "react@19.2.8",
  "react-dom@19.2.8",
  "typescript@5",
  "@base-ui/react@1.7.0",
  "rcikaym-porto",
] as const;

export type BootStep =
  | { kind: "cmd"; prompt: string; command: string }
  | { kind: "line"; tone: "out" | "ok" | "dim"; text: string }
  | { kind: "fetch"; pkg: string }
  | { kind: "bar" };

export function bootScript(): BootStep[] {
  return [
    {
      kind: "cmd",
      prompt: `${profile.user}@${profile.host}:~`,
      command: "pacman -S rcikaym-porto",
    },
    { kind: "line", tone: "dim", text: ":: synchronizing package databases…" },
    { kind: "line", tone: "dim", text: "resolving dependencies…" },
    { kind: "line", tone: "dim", text: "looking for conflicting packages…" },
    { kind: "line", tone: "out", text: `Packages (${BOOT_FETCHES.length})` },
    { kind: "line", tone: "out", text: ":: retrieving packages" },
    ...BOOT_FETCHES.map((pkg) => ({ kind: "fetch" as const, pkg })),
    { kind: "line", tone: "dim", text: "checking package integrity…" },
    { kind: "line", tone: "dim", text: "loading package files…" },
    { kind: "line", tone: "out", text: ":: processing package changes…" },
    { kind: "bar" },
    { kind: "line", tone: "dim", text: "installing rcikaym-porto…" },
    { kind: "line", tone: "dim", text: "unpacking README.md" },
    { kind: "line", tone: "dim", text: "unpacking about.md" },
    { kind: "line", tone: "dim", text: "unpacking experience.log" },
    { kind: "line", tone: "dim", text: "unpacking projects/" },
    { kind: "line", tone: "ok", text: "ready. type help" },
  ];
}

export function parseCssDuration(raw: string, fallbackMs: number): number {
  const v = raw.trim();
  if (!v) return fallbackMs;
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return fallbackMs;
  if (v.endsWith("ms")) return n;
  if (v.endsWith("s")) return n * 1000;
  return n;
}

export const BOOT_DELAY_FALLBACK = {
  tick: 90,
  fetch: 280,
  bar: 1200,
  hold: 1400,
} as const;

export function stepDelayMs(step: BootStep, styles: CSSStyleDeclaration): number {
  if (step.kind === "bar") {
    return parseCssDuration(styles.getPropertyValue("--boot-dur-bar"), BOOT_DELAY_FALLBACK.bar);
  }
  if (step.kind === "fetch") {
    return parseCssDuration(styles.getPropertyValue("--boot-dur-fetch"), BOOT_DELAY_FALLBACK.fetch);
  }
  return parseCssDuration(styles.getPropertyValue("--boot-dur-tick"), BOOT_DELAY_FALLBACK.tick);
}

/** Tick delays for every step except the last, then hold. Must stay under the overlay failsafe. */
export function bootSequenceMs(
  script: BootStep[],
  delays: {
    tick: number;
    fetch: number;
    bar: number;
    hold: number;
  } = BOOT_DELAY_FALLBACK,
): number {
  let ms = delays.hold;
  for (const step of script.slice(0, -1)) {
    ms +=
      step.kind === "bar"
        ? delays.bar
        : step.kind === "fetch"
          ? delays.fetch
          : delays.tick;
  }
  return ms;
}
