import { promises as fsPromises } from "fs";
import type { Dirent } from "fs";
import { join, relative, resolve } from "path";
import type { ContentManifest, EventDef, LoadedEvent } from "./schema";

export interface LoaderFileSystem {
  readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
  readFile(path: string, encoding: string): Promise<string>;
}

export interface LoaderOptions {
  rootDir?: string;
  fs?: LoaderFileSystem;
}

const DEFAULT_ROOT = resolve(process.cwd(), "script/content");

async function collectJsonFiles(rootDir: string, fsImpl: LoaderFileSystem): Promise<string[]> {
  const stack: string[] = [rootDir];
  const files: string[] = [];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    let entries: Dirent[] = [];
    try {
      entries = await fsImpl.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function normalizeEvent(def: unknown, source: string): LoadedEvent {
  if (!def || typeof def !== "object") {
    throw new Error(`Invalid event definition in ${source}`);
  }

  const typed = def as EventDef;
  if (!typed.id || typeof typed.id !== "string") {
    throw new Error(`Event missing required id in ${source}`);
  }

  if (!typed.nodes || !Array.isArray(typed.nodes)) {
    throw new Error(`Event '${typed.id}' in ${source} must define nodes.`);
  }

  return {
    source,
    definition: typed,
  };
}

export async function loadContent(options: LoaderOptions = {}): Promise<ContentManifest> {
  const fsImpl: LoaderFileSystem =
    options.fs ?? ({
      readdir: (path, opts) => fsPromises.readdir(path, opts),
      readFile: (path, encoding) => fsPromises.readFile(path, encoding),
    } as LoaderFileSystem);

  const rootDir = options.rootDir ? resolve(options.rootDir) : DEFAULT_ROOT;
  const files = await collectJsonFiles(rootDir, fsImpl);

  const events = new Map<string, LoadedEvent>();

  for (const filePath of files) {
    const relativePath = relative(rootDir, filePath);
    let raw = "";
    try {
      raw = await fsImpl.readFile(filePath, "utf-8");
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        continue;
      }
      throw error;
    }

    if (!raw.trim()) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse JSON content from ${relativePath}: ${(error as Error).message}`);
    }

    const definitions = Array.isArray(parsed) ? parsed : [parsed];
    for (const def of definitions) {
      const event = normalizeEvent(def, relativePath);
      if (events.has(event.definition.id)) {
        const existing = events.get(event.definition.id);
        throw new Error(
          `Duplicate event id '${event.definition.id}' found in '${relativePath}' and '${existing?.source}'.`,
        );
      }
      events.set(event.definition.id, event);
    }
  }

  return { events };
}
