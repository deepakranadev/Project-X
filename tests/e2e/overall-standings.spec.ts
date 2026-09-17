import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("updates overall standings as a match is finalized, reopened, re-finalized, and deleted", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Points Table" }).click();
  await page.getByLabel("Tournament name").fill("Overall Masters");
  await page.getByRole("button", { name: "Create Tournament" }).click();
  await page.getByRole("link", { name: "Teams" }).first().click();
  await page
    .getByLabel("Paste one team per line")
    .fill("Team Soul\nGodLike\nTeam XSpark");
  await page.getByRole("button", { name: "Add 3 Teams" }).click();
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Create Match" }).click();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();

  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(page).toHaveURL(/\/tournaments\/.*\/standings/);
  await expect(
    page.getByText("Only draft matches exist.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();

  const editor = page.locator("[data-match-entry]");
  const rows = [
    ["Team Soul", "1", "2"],
    ["GodLike", "2", "4"],
    ["Team XSpark", "3", "0"],
  ] as const;
  for (const [team, placement, finishes] of rows) {
    await editor.getByLabel(`Placement for ${team}`).fill(placement);
    await editor.getByLabel(`Finishes for ${team}`).fill(finishes);
  }
  await editor.getByRole("button", { name: "Finalize Match" }).click();

  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(
    page.getByText("1 finalized match", { exact: true }),
  ).toBeVisible();
  const mobileStandings = page.locator("[data-standings-mobile]");
  const soul = mobileStandings
    .locator("[data-standing-team]")
    .filter({ hasText: "Team Soul" });
  const godlike = mobileStandings
    .locator("[data-standing-team]")
    .filter({ hasText: "GodLike" });
  const xspark = mobileStandings
    .locator("[data-standing-team]")
    .filter({ hasText: "Team XSpark" });
  await expect(soul).toContainText("#1");
  await expect(soul).toContainText("12");
  await expect(godlike).toContainText("#2");
  await expect(godlike).toContainText("10");
  await expect(xspark).toContainText("#3");
  await expect(xspark).toContainText("5");

  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(
    page.getByText("Only draft matches exist.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Open Match 1" }).click();
  await editor.getByRole("button", { name: "Finalize Match" }).click();
  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(
    page.getByText("1 finalized match", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-standings-mobile] [data-standing-team]")
      .filter({ hasText: "Team Soul" }),
  ).toContainText("12");

  await page.getByRole("link", { name: "Matches", exact: true }).click();
  await page.getByRole("button", { name: "Match 1 options" }).click();
  await page.getByRole("menuitem", { name: "Delete Match" }).click();
  await page.getByRole("button", { name: "Delete Match" }).click();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  await page.getByRole("link", { name: "Standings", exact: true }).click();
  await expect(page).toHaveURL(/\/tournaments\/.*\/standings/);
  await expect(
    page.getByText("No finalized matches yet.", { exact: true }),
  ).toBeVisible();

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
