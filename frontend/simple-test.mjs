// Simple test to verify pagination and related techniques
import { chromium } from "@playwright/test";

async function testPagination() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Testing pagination and related techniques...");

  try {
    // Test 1: Pagination
    console.log("\n=== Testing Pagination ===");
    await page.goto("http://localhost:3000/tea-techniques/techniques");
    await page.waitForLoadState("networkidle");

    // Wait for techniques to load
    await page.waitForSelector('[data-testid="technique-card"]');

    const page1Count = await page
      .locator('[data-testid="technique-card"]')
      .count();
    const firstTechniquePage1 = await page
      .locator('[data-testid="technique-card"]')
      .first()
      .locator("h3")
      .textContent();
    console.log(
      `Page 1: ${page1Count} techniques, first: "${firstTechniquePage1}"`,
    );

    // Check if page 2 button exists
    const page2Button = page.locator('button:has-text("2")');
    if (await page2Button.isVisible()) {
      console.log("Page 2 button found, clicking...");
      await page2Button.click();
      await page.waitForTimeout(1000);

      const page2Count = await page
        .locator('[data-testid="technique-card"]')
        .count();
      const firstTechniquePage2 = await page
        .locator('[data-testid="technique-card"]')
        .first()
        .locator("h3")
        .textContent();
      console.log(
        `Page 2: ${page2Count} techniques, first: "${firstTechniquePage2}"`,
      );

      if (firstTechniquePage1 !== firstTechniquePage2) {
        console.log("✅ Pagination WORKING: Different techniques on page 2");
      } else {
        console.log("❌ Pagination BROKEN: Same techniques on both pages");
      }
    } else {
      console.log(
        "Page 2 button not found - may be normal if less than 20 techniques",
      );
    }

    // Test 2: Related techniques on individual technique page
    console.log("\n=== Testing Related Techniques ===");
    await page.goto(
      "http://localhost:3000/tea-techniques/techniques/shapley-additive-explanations",
    );
    await page.waitForLoadState("networkidle");

    // Wait for main content to load
    await page.waitForSelector("h1", { timeout: 10000 });
    const pageTitle = await page.locator("h1").textContent();
    console.log(`Loaded technique page: ${pageTitle}`);

    // Look for related techniques section
    const relatedSection = page.locator('h2:has-text("Related Techniques")');
    if (await relatedSection.isVisible()) {
      console.log("Related Techniques section found");

      // Wait a bit for data to load
      await page.waitForTimeout(2000);

      // Check for loading state
      const isLoading = await page
        .locator("text=Loading related techniques")
        .isVisible();
      if (isLoading) {
        console.log("❌ Related techniques STUCK in loading state");
      } else {
        // Check for actual related techniques
        const relatedTechniques = page
          .locator('a[href^="/techniques/"]')
          .filter({
            has: page.locator(
              "[aria-label], .lucide-layers, .lucide-arrow-right",
            ),
          });
        const relatedCount = await relatedTechniques.count();
        console.log(`Found ${relatedCount} related technique links`);

        if (relatedCount > 0) {
          const firstRelated = await relatedTechniques.first().textContent();
          console.log(
            `✅ Related techniques WORKING: Found "${firstRelated?.trim()}" and ${
              relatedCount - 1
            } others`,
          );
        } else {
          console.log("❌ Related techniques BROKEN: No technique links found");
        }
      }
    } else {
      console.log(
        "No Related Techniques section found (may be normal if technique has no relations)",
      );
    }

    // Test 3: Sidebar information
    console.log("\n=== Testing Sidebar Information ===");
    const sidebar = page.locator(".sticky");
    if (await sidebar.isVisible()) {
      const assuranceGoals = await page
        .locator('h3:has-text("Assurance Goals")')
        .count();
      const complexity = await page
        .locator('h3:has-text("Complexity")')
        .count();
      const tags = await page.locator('h3:has-text("All Tags")').count();

      console.log(
        `Sidebar sections found - Assurance Goals: ${assuranceGoals}, Complexity: ${complexity}, Tags: ${tags}`,
      );

      if (assuranceGoals > 0 && complexity > 0 && tags > 0) {
        console.log("✅ Sidebar WORKING: All expected sections present");
      } else {
        console.log("❌ Sidebar INCOMPLETE: Missing some sections");
      }
    } else {
      console.log("❌ Sidebar NOT FOUND");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  console.log("\n=== Test Summary Complete ===");
  await page.waitForTimeout(3000); // Keep browser open briefly to see results
  await browser.close();
}

testPagination();
