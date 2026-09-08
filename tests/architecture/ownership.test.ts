import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const sourceRoot = path.join(repositoryRoot, "src");

function filesBelow(directory: string): readonly string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    return statSync(absolutePath).isDirectory()
      ? filesBelow(absolutePath)
      : /\.(?:ts|tsx)$/.test(entry)
        ? [absolutePath]
        : [];
  });
}

function relative(file: string): string {
  return path.relative(repositoryRoot, file).replaceAll("\\", "/");
}

function importedSpecifiers(file: string): readonly string[] {
  const source = readFileSync(file, "utf8");
  const specifiers: string[] = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\sfrom\s*)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier) specifiers.push(specifier);
  }
  return specifiers;
}

function resolveSourceImport(
  importer: string,
  specifier: string,
): string | null {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const unresolved = specifier.startsWith("@/")
    ? path.join(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(importer), specifier);
  const candidates = [
    unresolved,
    `${unresolved}.ts`,
    `${unresolved}.tsx`,
    path.join(unresolved, "index.ts"),
    path.join(unresolved, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function sourceCycles(files: readonly string[]): readonly string[] {
  const graph = new Map(
    files.map((file) => [
      file,
      importedSpecifiers(file)
        .map((specifier) => resolveSourceImport(file, specifier))
        .filter((dependency): dependency is string => dependency !== null),
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles = new Set<string>();

  function visit(file: string): void {
    if (visited.has(file)) return;
    if (visiting.has(file)) {
      const cycleStart = stack.indexOf(file);
      cycles.add(
        [...stack.slice(cycleStart), file].map(relative).join(" -> "),
      );
      return;
    }

    visiting.add(file);
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(file);
    visited.add(file);
  }

  for (const file of files) visit(file);
  return [...cycles];
}

describe("R2F architecture ownership", () => {
  const sourceFiles = filesBelow(sourceRoot);

  it("keeps domain free of browser, UI, and infrastructure dependencies", () => {
    const domainFiles = sourceFiles.filter((file) =>
      relative(file).startsWith("src/domain/"),
    );
    const forbidden =
      /\b(?:Blob|File|window|document|indexedDB|IDB(?:Database|Transaction|Request|ObjectStore|Index|ValidKey))\b|crypto\.randomUUID|@\/(?:features|screens|infrastructure)\//;
    const violations = domainFiles
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(violations).toEqual([]);
  });

  it("keeps screen imports out of features and UI imports out of infrastructure", () => {
    const violations = sourceFiles.flatMap((file) => {
      const filePath = relative(file);
      const source = readFileSync(file, "utf8");
      if (
        filePath.startsWith("src/features/") &&
        /from\s+["']@\/screens\//.test(source)
      ) {
        return [`${filePath}: feature -> screen`];
      }
      if (
        filePath.startsWith("src/infrastructure/") &&
        /from\s+["'](?:react|@\/screens\/|@\/features\/[^"']+\/components\/)/.test(
          source,
        )
      ) {
        return [`${filePath}: infrastructure -> UI`];
      }
      return [];
    });

    expect(violations).toEqual([]);
  });

  it("keeps IndexedDB and browser APIs out of repository contracts", () => {
    const repositoryContracts = sourceFiles.filter(
      (file) =>
        relative(file).startsWith("src/features/") &&
        /Repository\.ts$/i.test(file),
    );
    const forbidden =
      /\b(?:Blob|File|window|document|indexedDB|IDB(?:Database|Transaction|Request|ObjectStore|Index|ValidKey))\b|@\/infrastructure\//;
    const violations = repositoryContracts
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(violations).toEqual([]);
  });

  it("has one feature-owned ScoringConfigDraft definition", () => {
    const definitions = sourceFiles
      .filter((file) =>
        /\binterface\s+ScoringConfigDraft\b/.test(readFileSync(file, "utf8")),
      )
      .map(relative);

    expect(definitions).toEqual([
      "src/features/scoring/scoringConfigDraft.ts",
    ]);
  });

  it("does not restore pre-R2E or superseded R2F import paths", () => {
    const checkedFiles = [
      ...sourceFiles,
      ...filesBelow(path.join(repositoryRoot, "tests")),
    ];
    const obsoleteImport =
      /(?:@\/|\/src\/)(?:components|lib)\/|domain\/tournaments\/scoringConfigDraft|domain\/teams\/parseBulkTeamNames/;
    const violations = checkedFiles
      .filter((file) => obsoleteImport.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(violations).toEqual([]);
  });

  it("has no circular source-module dependency", () => {
    expect(sourceCycles(sourceFiles)).toEqual([]);
  });
});
