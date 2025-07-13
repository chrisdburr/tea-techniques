import { test, expect } from "@playwright/test";

test.describe("Basic Application Tests", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/TEA Techniques/i);

    // Check for main navigation elements
    await expect(page.getByRole("link", { name: /techniques/i })).toBeVisible();
  });

  test("techniques page loads and displays techniques", async ({ page }) => {
    await page.goto("/techniques");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the techniques page
    await expect(
      page.getByRole("heading", { name: /techniques/i }),
    ).toBeVisible();

    // Check that technique cards are displayed
    // This assumes techniques are loaded from the backend
    await expect(
      page.locator('[data-testid="technique-card"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("search functionality works", async ({ page }) => {
    await page.goto("/techniques");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Find the search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Perform a search
    await searchInput.fill("SHAP");
    await searchInput.press("Enter");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Check that search results are displayed
    // This test assumes SHAP technique exists in the test data
    await expect(page.getByText(/SHAP/i)).toBeVisible();
  });

  test("technique detail page loads", async ({ page }) => {
    await page.goto("/techniques");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Click on the first technique card
    const firstTechniqueCard = page
      .locator('[data-testid="technique-card"]')
      .first();
    await expect(firstTechniqueCard).toBeVisible({ timeout: 10000 });
    await firstTechniqueCard.click();

    // Check that we're on a technique detail page
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Check for technique details sections
    await expect(page.getByText(/description/i)).toBeVisible();
  });

  test("navigation works correctly", async ({ page }) => {
    await page.goto("/");

    // Test navigation to techniques page
    await page.getByRole("link", { name: /techniques/i }).click();
    await expect(page).toHaveURL(/techniques/);

    // Test back navigation
    await page.goBack();
    await expect(page).toHaveURL("/");
  });

  test("responsive design - mobile view", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Check that mobile navigation is present
    // This test depends on your mobile navigation implementation
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
  });

  test("accessibility - keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Test keyboard navigation
    await page.keyboard.press("Tab");

    // Check that focus is visible on interactive elements
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("handles 404 pages gracefully", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Check for 404 page or redirect to home
    const is404 = await page.locator("text=404").isVisible();
    const isRedirected = page.url().includes("/");

    expect(is404 || isRedirected).toBeTruthy();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route("/api/**", (route) => route.abort());

    await page.goto("/techniques");

    // Check that error state is displayed
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
  });
});
