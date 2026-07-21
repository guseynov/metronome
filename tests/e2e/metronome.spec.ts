import { expect, test } from "@playwright/test";

test("runs the core playback and keyboard meter flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("spinbutton")).toHaveValue("100");
  await page.getByRole("radio", { name: "4/4 time" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "5/4 time" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "5/4 time" })).toBeFocused();

  await page.getByRole("button", { name: "Start metronome" }).click();
  await expect(page.getByRole("button", { name: "Stop metronome" })).toBeVisible();
  await expect(page.getByText("Counting")).toBeVisible();
  await expect(page.locator(".beat-indicator-active")).toHaveCount(1, {
    timeout: 2_000,
  });

  await page.getByRole("button", { name: "Stop metronome" }).click();
  await expect(page.getByText("Ready")).toBeVisible();
});

test("retries sound loading after a transient request failure", async ({ page }) => {
  let wavRequests = 0;
  let failedOnce = false;

  await page.route("**/*.wav", async (route) => {
    wavRequests += 1;
    if (!failedOnce) {
      failedOnce = true;
      await route.abort("failed");
      return;
    }

    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Start metronome" }).click();
  await expect(page.getByRole("alert")).toContainText("Audio unavailable");
  const requestsAfterFailure = wavRequests;

  await page.getByRole("button", { name: "Start metronome" }).click();
  await expect(page.getByRole("button", { name: "Stop metronome" })).toBeVisible();
  expect(wavRequests).toBeGreaterThan(requestsAfterFailure);
});

test("keeps Start reachable on a short phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const startButton = page.getByRole("button", { name: "Start metronome" });
  await expect(startButton).toBeInViewport();
  await expect(startButton).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
});
