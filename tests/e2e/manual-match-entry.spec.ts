import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("creates, finalizes, reloads, and edits a team-level manual match on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Points Table" }).click();
  await page.getByLabel("Tournament name").fill("Manual Match Masters");
  await page.getByRole("button", { name: "Create Tournament" }).click();

  await page
    .getByLabel("Paste one team per line")
    .fill("Team Soul\nGodLike\nTeam XSpark\nOrangutan\n8Bit\nRevenant");
  await page.getByRole("button", { name: "Add 6 Teams" }).click();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Create Match" }).click();

  const editor = page.locator('[data-match-entry]');
  await expect(editor.getByRole("heading", { name: "Match 1" })).toBeVisible();
  await editor.getByRole("button", { name: "Set Revenant as DNP" }).click();
  await editor.getByRole("button", { name: "Auto-fill placements" }).click();

  const soulPlacement = editor.getByLabel("Placement for Team Soul");
  await soulPlacement.focus();
  await soulPlacement.press("Enter");
  await expect(editor.getByLabel("Finishes for Team Soul")).toBeFocused();

  const finishes = [12, 8, 9, 3, 5] as const;
  const playedTeams = ["Team Soul", "GodLike", "Team XSpark", "Orangutan", "8Bit"] as const;
  for (const [index, team] of playedTeams.entries()) {
    await expect(editor.getByLabel(`Placement for ${team}`)).toHaveValue(String(index + 1));
    await editor.getByLabel(`Finishes for ${team}`).fill(String(finishes[index]));
  }
  await expect(editor.getByLabel("Placement for Revenant")).toBeDisabled();
  await expect(editor.getByLabel("Finishes for Revenant")).toBeDisabled();

  await expect(editor.getByText("Saved", { exact: true })).toBeVisible();
  await editor.getByLabel("Finishes for 8Bit").fill("6");
  await editor.getByRole("button", { name: "Finalize Match" }).click();
  await expect(editor.getByText("Finalized", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const auditWindow = window as typeof window & { __r2gWriteTransactions: number };
    auditWindow.__r2gWriteTransactions = 0;
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (storeNames, mode, options) {
      if (mode === "readwrite") auditWindow.__r2gWriteTransactions += 1;
      return original.call(this, storeNames, mode, options);
    };
  });
  await editor.getByRole("button", { name: "Close" }).click();
  await expect(editor).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(
    await page.evaluate(
      () => (window as typeof window & { __r2gWriteTransactions: number }).__r2gWriteTransactions,
    ),
  ).toBe(0);
  const matchRow = page.locator("li").filter({
    has: page.getByRole("button", { name: "Open Match 1" }),
  });
  await expect(matchRow.getByText("Finalized", { exact: true })).toBeVisible();
  await page.waitForTimeout(700);
  await expect(matchRow.getByText("Finalized", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(page.getByText("1 finalized match", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await expect(
    page.locator("li").filter({
      has: page.getByRole("button", { name: "Open Match 1" }),
    }).getByText("Finalized", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  const reopened = page.locator('[data-match-entry]');
  await expect(reopened.getByLabel("Placement for Team Soul")).toHaveValue("1");
  await expect(reopened.getByLabel("Finishes for Team Soul")).toHaveValue("12");
  await expect(reopened.getByLabel("Finishes for 8Bit")).toHaveValue("6");
  await expect(reopened.getByRole("button", { name: "Mark Revenant as played" })).toHaveAttribute("aria-pressed", "true");

  await reopened.getByLabel("Finishes for GodLike").fill("10");
  await reopened.getByRole("button", { name: "Save Draft" }).click();
  await expect(reopened.getByText("Saved", { exact: true })).toBeVisible();
  await expect(reopened.getByText("Draft", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  await expect(page.locator('[data-match-entry]').getByLabel("Finishes for GodLike")).toHaveValue("10");

  const latestEditor = page.locator("[data-match-entry]");
  await latestEditor.getByLabel("Finishes for GodLike").fill("11");
  await latestEditor.getByLabel("Finishes for GodLike").fill("13");
  await expect(latestEditor.getByText("Changes waiting to save", { exact: true })).toBeVisible();
  await expect(latestEditor.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  await expect(page.locator("[data-match-entry]").getByLabel("Finishes for GodLike")).toHaveValue("13");

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }
});

test("an open match observes canonical roster additions and team identity edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Points Table" }).click();
  await page.getByLabel("Tournament name").fill("Live Roster Cup");
  await page.getByRole("button", { name: "Create Tournament" }).click();
  await page.getByLabel("Paste one team per line").fill("Team Soul\nGodLike");
  await page.getByRole("button", { name: "Add 2 Teams" }).click();
  await page.getByRole("button", { name: "Create Match" }).click();

  const editor = page.locator("[data-match-entry]");
  await expect(editor.getByLabel("Placement for Team Soul")).toBeVisible();
  await page.getByRole("link", { name: "Teams", exact: true }).click();
  await page.getByLabel("Paste one team per line").fill("Team XSpark");
  await page.getByRole("button", { name: "Add 1 Team" }).click();
  await expect(editor.getByLabel("Placement for Team XSpark")).toBeVisible();

  await page.getByRole("button", { name: "Edit Team Soul" }).click();
  await page.getByRole("dialog", { name: "Edit team" }).getByLabel("Team name").fill("Soul Prime");
  await page.getByRole("dialog", { name: "Edit team" }).getByRole("button", { name: "Save team" }).click();
  await expect(editor.getByLabel("Placement for Soul Prime")).toBeVisible();
  await expect(editor.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  await expect(page.locator("[data-match-entry]").getByLabel("Placement for Team XSpark")).toBeVisible();
  await expect(page.locator("[data-match-entry]").getByLabel("Placement for Soul Prime")).toBeVisible();
});
