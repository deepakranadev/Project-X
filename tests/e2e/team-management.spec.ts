import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("creates, edits, and reloads a six-team mobile roster", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Points Table" }).click();
  await page.getByLabel("Tournament name").fill("Roster Rush");
  await page.getByRole("button", { name: "Create Tournament" }).click();

  const bulkEntry = page.getByLabel("Paste one team per line");
  await bulkEntry.fill(
    "Team Soul\r\nGodLike Esports\r\nTeam XSpark\r\nOrangutan\r\n8Bit\r\nRevenant",
  );
  await expect(page.getByText("6 teams detected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add 6 Teams" }).click();

  const expectedRoster = [
    ["#1", "Team Soul"],
    ["#2", "GodLike Esports"],
    ["#3", "Team XSpark"],
    ["#4", "Orangutan"],
    ["#5", "8Bit"],
    ["#6", "Revenant"],
  ] as const;
  for (const [slot, name] of expectedRoster) {
    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row).toContainText(slot);
    await expect(row).toContainText(name);
  }

  await page.getByRole("button", { name: "Edit Team XSpark" }).click();
  await page.getByLabel("Team name").fill("Team XSpark Elite");
  await page.getByLabel("Short name").fill("TXE");
  await page.getByLabel("Slot number").fill("7");
  await page.getByRole("button", { name: "Save team" }).click();
  await expect(page.getByText("Team changes saved.")).toBeVisible();

  await page.reload();

  const editedRow = page
    .getByRole("listitem")
    .filter({ hasText: "Team XSpark Elite" });
  await expect(editedRow).toContainText("#7");
  await expect(editedRow).toContainText("TXE");
  await expect(page.getByRole("listitem")).toHaveCount(6);

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await expect(page.getByLabel("Paste one team per line")).toBeVisible();
  }
});
