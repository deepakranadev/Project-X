import { readFileSync, readdirSync, statSync } from "node:fs";
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

describe("R2I UI Boundaries", () => {
  const sourceFiles = filesBelow(sourceRoot);
  const sharedUiFiles = sourceFiles.filter((file) => relative(file).startsWith("src/shared/ui/"));
  const domainFiles = sourceFiles.filter((file) => relative(file).startsWith("src/domain/"));
  const infraFiles = sourceFiles.filter((file) => relative(file).startsWith("src/infrastructure/"));

  it("prevents shared/ui from importing features, screens, infrastructure, or domain", () => {
    const forbidden = /from\s+["']@\/(?:features|screens|infrastructure|domain)\//;
    const violations = sharedUiFiles
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);
    expect(violations).toEqual([]);
  });

  it("prevents Formik imports in shared/ui", () => {
    const forbidden = /from\s+["']formik["']/;
    const violations = sharedUiFiles
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);
    expect(violations).toEqual([]);
  });

  it("prevents domain from importing shared/ui", () => {
    const forbidden = /from\s+["']@\/shared\/ui\//;
    const violations = domainFiles
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);
    expect(violations).toEqual([]);
  });

  it("prevents infrastructure from importing shared/ui", () => {
    const forbidden = /from\s+["']@\/shared\/ui\//;
    const violations = infraFiles
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map(relative);
    expect(violations).toEqual([]);
  });
});
