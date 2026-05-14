import { ExifTool, type Tags } from "exiftool-vendored";

// One long-lived ExifTool process for the whole build. Spawning a new one
// per <ImageView> registered too many process exit listeners and tripped
// Node's MaxListenersExceededWarning.
let instance: ExifTool | undefined;

function getReader(): ExifTool {
  if (!instance) instance = new ExifTool();
  return instance;
}

export function readTags(path: string): Promise<Tags> {
  return getReader().read(path);
}
