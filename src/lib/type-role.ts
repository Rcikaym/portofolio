export const HELLO_ROLES = [
  "Fadlan",
  "Junior Software Engineer",
  "Tech Enthusiast",
  "Rcikaym",
] as const;

export const TYPE_MS = {
  char: 70,
  delete: 40,
  hold: 1400,
  holdName: 2400,
  pause: 500,
} as const;

export type TypePhase = "type" | "delete";

export type TypeState = {
  i: number;
  n: number;
  phase: TypePhase;
};

export function longestRole(): string {
  return HELLO_ROLES.reduce((a, b) => (a.length >= b.length ? a : b));
}

export function startState(): TypeState {
  return { i: 0, n: HELLO_ROLES[0].length, phase: "type" };
}

export function typedText(state: TypeState): string {
  const word = HELLO_ROLES[state.i] ?? HELLO_ROLES[0];
  return word.slice(0, state.n);
}

export function isFullWord(state: TypeState): boolean {
  const word = HELLO_ROLES[state.i] ?? HELLO_ROLES[0];
  return state.n === word.length;
}

/** ponytail: O(steps) loop over a small role list. Upgrade: stop after one pass. */
export function typeStep(state: TypeState): { next: TypeState; wait: number } {
  const word = HELLO_ROLES[state.i] ?? HELLO_ROLES[0];
  if (state.phase === "type") {
    if (state.n < word.length) {
      return { next: { ...state, n: state.n + 1 }, wait: TYPE_MS.char };
    }
    return {
      next: { ...state, phase: "delete" },
      wait: state.i === 0 ? TYPE_MS.holdName : TYPE_MS.hold,
    };
  }
  if (state.n > 0) {
    return { next: { ...state, n: state.n - 1 }, wait: TYPE_MS.delete };
  }
  const i = (state.i + 1) % HELLO_ROLES.length;
  return { next: { i, n: 0, phase: "type" }, wait: TYPE_MS.pause };
}
