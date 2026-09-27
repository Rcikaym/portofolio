/* Central map of High-Res XP .ico assets in public/xp-icons/.
 * Filenames contain spaces/parens — always go through xpIcon() so the URL
 * is encoded. Plain <img> is used (Next <Image> can't optimize .ico). */

export const XP_ICON_FILES = {
  myComputer: "My Computer.ico",
  terminal: "terminal.png",
  editor: "Display.ico",
  about: "My Profile Folder.ico",
  experience: "List File.ico",
  iexplore: "Earth (fixed).ico",
  contact: "Phone.ico",
  camera: "Camera.ico",
  document: "File.ico",
  log: "List File.ico",
  file: "File.ico",
  folderClosed: "Folder Closed.ico",
  folderOpen: "Folder Open.ico",
  user: "User 1.ico",
  control: "System Properties.ico",
  help: "User Support.ico",
  network: "My Network Places.ico",
  run: "Game Controller.ico",
} as const;

export type XpIconKey = keyof typeof XP_ICON_FILES;

export function xpIcon(key: XpIconKey): string {
  return `/xp-icons/${encodeURIComponent(XP_ICON_FILES[key])}`;
}
