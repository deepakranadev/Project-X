import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const artifactDir = "C:/Users/WELCOME/.gemini/antigravity-ide/brain/94cdfccc-8cae-487f-855a-79788eb862d9/standings_qa";

test.beforeAll(() => {
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
});

test.describe("Standings Visual QA & Geometry", () => {
  test("Desktop 1440 & 1920 geometry and populated standings", async ({ page }) => {
    // Setup tournament with teams and finalized match
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("link", { name: "Create Points Table" }).click();
    await page.getByLabel("Tournament name").fill("BGMI Masters Series 2025");
    await page.getByRole("button", { name: "Create Tournament" }).click();

    await page.getByRole("link", { name: /Teams/ }).first().click();
    await page.getByLabel("Paste one team per line").fill(
      "Team Soul\nGodLike Esports\nTeam XSpark\nOrangutan\nBlind Esports\nRevenant Esports\nMedal Esports\nEntity Gaming\nGlobal Esports\n8Bit\nCarnival Gaming\nFS Esports\nGujarat Tigers\nHydra Official\nReckoning Esports\nAutobotz Esports"
    );
    await page.getByRole("button", { name: "Add 16 Teams" }).click();

    // Create match and fill results
    await page.getByRole("link", { name: /Matches/ }).first().click();
    await page.getByRole("button", { name: "Create Match" }).click();
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
    await page.getByRole("button", { name: "Open Match 1" }).click();

    const editor = page.locator("[data-match-entry]");
    const matchResults = [
      ["Team Soul", "1", "12"],
      ["GodLike Esports", "2", "8"],
      ["Team XSpark", "3", "6"],
      ["Orangutan", "4", "4"],
      ["Blind Esports", "5", "3"],
      ["Revenant Esports", "6", "2"],
      ["Medal Esports", "7", "2"],
      ["Entity Gaming", "8", "1"],
      ["Global Esports", "9", "1"],
      ["8Bit", "10", "1"],
      ["Carnival Gaming", "11", "0"],
      ["FS Esports", "12", "0"],
      ["Gujarat Tigers", "13", "0"],
      ["Hydra Official", "14", "0"],
      ["Reckoning Esports", "15", "0"],
      ["Autobotz Esports", "16", "0"],
    ] as const;

    for (const [team, placement, finishes] of matchResults) {
      await editor.getByLabel(`Placement for ${team}`).fill(placement);
      await editor.getByLabel(`Finishes for ${team}`).fill(finishes);
    }
    await editor.getByRole("button", { name: "Finalize Match" }).click();

    // Navigate to Standings
    await page.getByRole("link", { name: /Standings/ }).first().click();
    await expect(page).toHaveURL(/\/tournaments\/.*\/standings/);
    await expect(page.getByText("1 finalized match")).toBeVisible();

    // Measure geometry at 1440x900
    const mainBox1440 = await page.evaluate(() => {
      const container = document.querySelector('[data-purpose="standings-main"] > div');
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
      };
    });
    console.log("GEOMETRY_1440:", JSON.stringify(mainBox1440));
    expect(mainBox1440).not.toBeNull();
    if (mainBox1440) {
      expect(mainBox1440.width).toBeCloseTo(1024, 0);
      expect(mainBox1440.x).toBeGreaterThanOrEqual(320);
      expect(mainBox1440.x).toBeLessThanOrEqual(340);
    }

    // Capture 1440 screenshot
    await page.screenshot({
      path: path.join(artifactDir, "desktop_1440_populated.png"),
      fullPage: false,
    });

    // Test Export CTA interaction
    const exportBtn = page.locator('[data-action="export-points-table-desktop"]');
    await exportBtn.click();
    await expect(page.locator('[data-sonner-toast]').last()).toContainText("Points table export will be available");

    // Measure geometry at 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    const mainBox1920 = await page.evaluate(() => {
      const container = document.querySelector('[data-purpose="standings-main"] > div');
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
      };
    });
    console.log("GEOMETRY_1920:", JSON.stringify(mainBox1920));
    expect(mainBox1920).not.toBeNull();
    if (mainBox1920) {
      expect(mainBox1920.width).toBeCloseTo(1024, 0);
      expect(mainBox1920.x).toBeGreaterThanOrEqual(560);
      expect(mainBox1920.x).toBeLessThanOrEqual(580);
    }

    // Capture 1920 screenshot
    await page.screenshot({
      path: path.join(artifactDir, "desktop_1920_populated.png"),
      fullPage: false,
    });

    // Test Mobile viewports
    for (const width of [430, 390, 360]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`OVERFLOW_${width}:`, hasOverflow);
      expect(hasOverflow).toBe(false);

      await page.screenshot({
        path: path.join(artifactDir, `mobile_${width}_populated.png`),
        fullPage: false,
      });
    }

    // Tablet QA (768 & 1024)
    for (const width of [768, 1024]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.waitForTimeout(200);
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`OVERFLOW_TABLET_${width}:`, hasOverflow);
      expect(hasOverflow).toBe(false);
      await page.screenshot({
        path: path.join(artifactDir, `tablet_${width}_populated.png`),
        fullPage: false,
      });
    }
  });

  test("Empty state, tied standings, and decimal scoring", async ({ page }) => {
    test.setTimeout(60000);
    // 1. Empty state
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("link", { name: "Create Points Table" }).click();
    await page.getByLabel("Tournament name").fill("Ties & Decimals Open");
    await page.getByRole("button", { name: "Create Tournament" }).click();

    await page.getByRole("link", { name: /Standings/ }).first().click();
    await expect(page.getByText("No finalized matches yet.")).toBeVisible();
    await page.screenshot({
      path: path.join(artifactDir, "desktop_empty_state.png"),
      fullPage: false,
    });

    // Add teams: including long team names
    await page.getByRole("link", { name: /Teams/ }).first().click();
    await page.getByLabel("Paste one team per line").fill(
      "Royal Never Give Up International Esports\nAlpha Gaming Syndicate\nBravo Tactical Unit"
    );
    await page.getByRole("button", { name: "Add 3 Teams" }).click();

    // 2. Draft-only state
    await page.getByRole("link", { name: /Matches/ }).first().click();
    await page.getByRole("button", { name: "Create Match" }).click();
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();

    await page.getByRole("link", { name: /Standings/ }).first().click();
    await expect(page.getByText("Only draft matches exist.")).toBeVisible();

    // 3. Configure decimal scoring (1.50 per finish)
    await page.getByRole("link", { name: /Scoring/ }).first().click();
    await page.getByRole("button", { name: "Custom" }).first().click();
    const killPtsInput = page.getByLabel("Points per finish");
    await killPtsInput.fill("1.50");
    await page.getByRole("button", { name: "Save Scoring Configuration" }).click();
    await expect(page.getByText("Scoring saved")).toBeVisible();

    // 4. Fill Match 1: Alpha 1st with 1 kill (11.50 pts), Bravo and Royal both DNP (0 pts, tied at Rank 2)
    await page.getByRole("link", { name: /Matches/ }).first().click();
    await page.getByRole("button", { name: "Open Match 1" }).click();

    const editor = page.locator("[data-match-entry]");
    await editor.getByRole("button", { name: "Set Bravo Tactical Unit as DNP" }).click();
    await editor.getByRole("button", { name: "Set Royal Never Give Up International Esports as DNP" }).click();

    await editor.getByLabel("Placement for Alpha Gaming Syndicate").fill("1");
    await editor.getByLabel("Finishes for Alpha Gaming Syndicate").fill("1");

    await editor.getByRole("button", { name: "Finalize Match" }).click();
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();

    // Check Standings
    await page.getByRole("link", { name: /Standings/ }).first().click();
    await expect(page.getByText("1 finalized match")).toBeVisible();

    // Verify decimal scores rendered cleanly (11.50)
    await expect(page.getByText("11.50", { exact: false }).first()).toBeVisible();

    // Verify tied ranks: both Bravo and Royal share rank #2
    const desktopRows = page.locator("tbody tr[data-standing-team]");
    const bravoRow = desktopRows.filter({ hasText: "Bravo Tactical Unit" });
    const royalRow = desktopRows.filter({ hasText: "Royal Never Give Up International Esports" });
    await expect(bravoRow).toContainText("2");
    await expect(royalRow).toContainText("2");

    // Capture tied & decimal state screenshot on desktop
    await page.screenshot({
      path: path.join(artifactDir, "desktop_tied_decimal_longname.png"),
      fullPage: false,
    });

    // Check mobile with long team names & decimals at 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);

    const hasOverflowMobile = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflowMobile).toBe(false);

    await page.screenshot({
      path: path.join(artifactDir, "mobile_tied_decimal_longname.png"),
      fullPage: false,
    });
  });
});
