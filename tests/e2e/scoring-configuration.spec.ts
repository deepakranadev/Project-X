import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("customizes and reloads tournament scoring on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Points Table" }).click();
  await page.getByLabel("Tournament name").fill("Scoring Masters");
  await page.getByRole("button", { name: "Create Tournament" }).click();
  await page.getByRole("link", { name: "Teams" }).first().click();

  await page
    .getByLabel("Paste one team per line")
    .fill("Team Soul\nGodLike\nTeam XSpark\nOrangutan\n8Bit\nRevenant");
  await page.getByRole("button", { name: "Add 6 Teams" }).click();
  await page.getByRole("link", { name: "Scoring", exact: true }).click();

  await expect(
    page.getByRole("button", { name: "BGMI Standard" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Points for 1st place")).toHaveValue("10");
  await expect(page.getByLabel("Points for 2nd place")).toHaveValue("6");
  await expect(page.getByLabel("Points for 8th place")).toHaveValue("1");
  await expect(page.getByLabel("Points for 16th place")).toHaveValue("0");
  await expect(page.getByLabel("Points per finish")).toHaveValue("1");

  await page.getByRole("button", { name: "Custom" }).click();
  await page.getByLabel("Points for 1st place").fill("10.999");
  await page.getByLabel("Points per finish").fill("0.001");
  await page.getByRole("button", { name: "Save Scoring" }).click();
  await expect(
    page.getByText("Placement points for 1st must use at most 2 decimal places."),
  ).toBeVisible();
  await expect(
    page.getByText("Points per finish must use at most 2 decimal places."),
  ).toBeVisible();

  await page.getByLabel("Points for 1st place").fill("10.75");
  await page.getByLabel("Points per finish").fill("0.25");
  await page.getByRole("button", { name: "Move Total Finishes up" }).click();
  await page.getByRole("button", { name: "Save Scoring" }).click();
  await expect(page.getByText("Scoring saved", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name: "Scoring", exact: true }).click();

  await expect(page.getByRole("button", { name: "Custom" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Points for 1st place")).toHaveValue("10.75");
  await expect(page.getByLabel("Points per finish")).toHaveValue("0.25");
  await expect
    .poll(() =>
      page
        .locator('[data-testid="tiebreak-order"] [data-tiebreaker]')
        .evaluateAll((rows) =>
          rows.map((row) => row.getAttribute("data-tiebreaker")),
        ),
    )
    .toEqual([
      "WWCD",
      "TOTAL_KILLS",
      "PLACEMENT_POINTS",
      "LATEST_MATCH_PLACEMENT",
    ]);

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
