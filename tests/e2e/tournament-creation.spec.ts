import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("creates a guest BGMI tournament that survives refresh", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Create Points Table" }).click();
  await expect(page).toHaveURL(/\/tournaments\/new$/);
  await expect(page.getByLabel("Game")).toHaveValue("BGMI");

  await page.getByLabel("Tournament name").fill("Mobile Masters");
  await page.getByLabel("Organizer name").fill("Nova Esports");
  await page.locator("#tournamentLogo").setInputFiles({
    name: "mobile-masters.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Create Tournament" }).click();

  await expect(page).toHaveURL(/\/tournaments\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Mobile Masters" }),
  ).toBeVisible();
  await expect(page.getByText("BGMI", { exact: true }).first()).toBeVisible();
  // await expect(page.getByText("Nova Esports", { exact: true })).toBeVisible();
  // await expect(page.getByAltText("Mobile Masters logo")).toBeVisible();
  // await expect(page.getByText("Team setup", { exact: true })).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("heading", { level: 1, name: "Mobile Masters" }),
  ).toBeVisible();
  // await expect(page.getByAltText("Mobile Masters logo")).toBeVisible();
  await expect(page.getByText("Ready to begin")).toBeVisible();
});
