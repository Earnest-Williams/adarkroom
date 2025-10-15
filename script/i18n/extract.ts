import { promises as fs } from "fs";
import { dirname, join, relative, resolve } from "path";

interface ExtractionOptions {
  contentRoot: string;
  featureRoot: string;
  localeFile: string;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  contentRoot: resolve(process.cwd(), "script/content"),
  featureRoot: resolve(process.cwd(), "script/features"),
  localeFile: resolve(process.cwd(), "lang/en.json"),
};

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(root: string, extensions: Set<string>): Promise<string[]> {
  const results: string[] = [];
  const stack: string[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
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
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
        if (extensions.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  return results.sort();
}

function extractFromEventJson(raw: string, collector: Set<string>, source: string): void {
  if (!raw.trim()) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${source}: ${(error as Error).message}`);
  }

  const definitions = Array.isArray(parsed) ? parsed : [parsed];
  for (const def of definitions) {
    if (!def || typeof def !== "object") {
      continue;
    }
    const event = def as { nodes?: unknown[]; id?: string };
    if (!Array.isArray(event.nodes)) {
      continue;
    }
    for (const node of event.nodes) {
      if (!node || typeof node !== "object") {
        continue;
      }
      const typedNode = node as { bodyKey?: string; choices?: unknown[] };
      if (typeof typedNode.bodyKey === "string") {
        collector.add(typedNode.bodyKey);
      }
      if (!Array.isArray(typedNode.choices)) {
        continue;
      }
      for (const choice of typedNode.choices) {
        if (!choice || typeof choice !== "object") {
          continue;
        }
        const typedChoice = choice as { textKey?: string; next?: string; effects?: unknown[] };
        if (typeof typedChoice.textKey === "string") {
          collector.add(typedChoice.textKey);
        }
      }
    }
  }
}

const TS_KEY_PATTERNS: RegExp[] = [
  /\bi18n\.t\(\s*['"]([^'"\\)]+)['"]/g,
  /\bt\(\s*['"]([^'"\\)]+)['"]/g,
  /i18nKey\s*=\s*"([^"]+)"/g,
  /i18nKey\s*=\s*'([^']+)'/g,
];

function extractFromSource(source: string, collector: Set<string>): void {
  for (const pattern of TS_KEY_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(source))) {
      const key = match[1];
      if (key) {
        collector.add(key);
      }
    }
  }
}

async function loadLocaleMap(localePath: string): Promise<Record<string, string>> {
  if (!(await exists(localePath))) {
    return {};
  }

  const raw = await fs.readFile(localePath, "utf-8");
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch (error) {
    throw new Error(`Failed to parse locale file ${localePath}: ${(error as Error).message}`);
  }
}

async function saveLocaleMap(localePath: string, values: Record<string, string>): Promise<void> {
  const orderedEntries = Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
  const ordered = Object.fromEntries(orderedEntries);
  const payload = `${JSON.stringify(ordered, null, 2)}\n`;
  await fs.mkdir(dirname(localePath), { recursive: true });
  await fs.writeFile(localePath, payload, "utf-8");
}

function diffKeys(found: Set<string>, existing: Record<string, string>): {
  missing: string[];
  orphaned: string[];
} {
  const missing = Array.from(found).filter((key) => !(key in existing)).sort();
  const orphaned = Object.keys(existing)
    .filter((key) => !found.has(key))
    .sort();
  return { missing, orphaned };
}

async function extract(options: ExtractionOptions): Promise<void> {
  const keys = new Set<string>();

  const contentExists = await exists(options.contentRoot);
  if (contentExists) {
    const jsonFiles = await collectFiles(options.contentRoot, new Set(["json"]));
    for (const filePath of jsonFiles) {
      const raw = await fs.readFile(filePath, "utf-8");
      extractFromEventJson(raw, keys, relative(options.contentRoot, filePath));
    }
  }

  const featureExists = await exists(options.featureRoot);
  if (featureExists) {
    const sourceFiles = await collectFiles(options.featureRoot, new Set(["ts", "tsx"]));
    for (const filePath of sourceFiles) {
      const raw = await fs.readFile(filePath, "utf-8");
      extractFromSource(raw, keys);
    }
  }

  const localeValues = await loadLocaleMap(options.localeFile);
  const { missing, orphaned } = diffKeys(keys, localeValues);

  for (const key of missing) {
    localeValues[key] = "";
  }
  for (const key of orphaned) {
    delete localeValues[key];
  }

  await saveLocaleMap(options.localeFile, localeValues);

  if (missing.length > 0) {
    console.log(`Added ${missing.length} new translation key(s).`);
  }
  if (orphaned.length > 0) {
    console.error(`Removed ${orphaned.length} orphan translation key(s): ${orphaned.join(", ")}`);
    throw new Error("Orphaned translation keys detected.");
  }

  if (missing.length === 0) {
    console.log("No new translation keys detected.");
  }
}

void extract(DEFAULT_OPTIONS).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
