/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("UI-L1 Shell Validation", () => {
  const repositoryRoot = process.cwd();

  function getFile(relativePath: string) {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
  }

  it("layout.tsx contains exactly one light-themed Toaster", () => {
    const content = getFile("src/app/layout.tsx");
    
    // Check it has Toaster
    expect(content).toMatch(/<Toaster/);
    
    // Check it is light themed
    expect(content).toMatch(/theme="light"/);
    
    // Check it is NOT dark themed
    expect(content).not.toMatch(/theme="dark"/);
    
    // Count Toaster tags to ensure there's exactly one
    const matches = content.match(/<Toaster/g);
    expect(matches).toBeDefined();
    expect(matches?.length).toBe(1);
  });
});

