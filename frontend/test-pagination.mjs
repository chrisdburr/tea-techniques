// Quick script to test pagination
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
  console.log("Navigating to techniques page...");
  await page.goto("http://localhost:3000/tea-techniques/techniques");

  // Wait for the page to load
  await page.waitForSelector('[data-testid="technique-card"]', {
    timeout: 10000,
  });

  console.log("Getting initial technique count...");
  const initialTechniques = await page
    .locator('[data-testid="technique-card"]')
    .count();
  console.log(`Initial page has ${initialTechniques} techniques`);

  // Get the text of the first technique on page 1
  const firstTechniqueOnPage1 = await page
    .locator('[data-testid="technique-card"]')
    .first()
    .locator("h3")
    .textContent();
  console.log(`First technique on page 1: ${firstTechniqueOnPage1}`);

  // Add console logs listener
  page.on("console", (msg) => {
    if (msg.text().includes("DEBUG: About to call useTechniques")) {
      console.log("CONSOLE:", msg.text());
    }
  });

  console.log("Looking for pagination controls...");
  const paginationNext = page.locator("button", { hasText: "Next" });
  const paginationPageTwo = page.locator("button", { hasText: "2" });

  if (await paginationPageTwo.isVisible()) {
    console.log("Clicking page 2...");
    await paginationPageTwo.click();

    // Wait a bit for React Query to update
    console.log("Waiting for page to update...");
    await page.waitForTimeout(2000);

    // Check if we still have techniques
    console.log("Getting technique count after clicking page 2...");
    const page2Techniques = await page
      .locator('[data-testid="technique-card"]')
      .count();
    console.log(`Page 2 has ${page2Techniques} techniques`);

    if (page2Techniques > 0) {
      const firstTechniqueOnPage2 = await page
        .locator('[data-testid="technique-card"]')
        .first()
        .locator("h3")
        .textContent();
      console.log(`First technique on page 2: ${firstTechniqueOnPage2}`);

      if (firstTechniqueOnPage1 === firstTechniqueOnPage2) {
        console.log(
          "❌ PROBLEM: Same techniques on both pages - pagination not working",
        );
      } else {
        console.log(
          "✅ SUCCESS: Different techniques on page 2 - pagination working",
        );
      }
    } else {
      console.log("❌ PROBLEM: No techniques found on page 2");
    }
  } else {
    console.log("❌ Pagination controls not found or not visible");
  }

  await page.waitForTimeout(5000); // Keep browser open for 5 seconds to see results
} catch (error) {
  console.error("Error:", error);
} finally {
  await browser.close();
}
