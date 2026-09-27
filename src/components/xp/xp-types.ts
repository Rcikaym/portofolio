export type XpAppId =
  | "terminal"
  | "editor"
  | "explorer"
  | "notepad"
  | "iexplore"
  | "camera";

export type XpWindow = {
  id: string;
  app: XpAppId;
  title: string;
  /** file path for notepad/explorer, undefined otherwise */
  path?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

let seq = 0;
export function xpId(prefix = "w"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
