import { test, expect } from '@playwright/test'

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/')
  })

  test.describe('Browse Techniques Journey', () => {
    test('should allow user to browse and view technique details', async ({ page }) => {
      // Start on techniques list page
      await expect(page.locator('h1')).toContainText('TEA Techniques')
      
      // Verify techniques are loaded
      await expect(page.locator('[data-testid="techniques-grid"]')).toBeVisible()
      await expect(page.locator('[data-testid^="technique-card-"]')).toHaveCount.greaterThan(0)
      
      // Click on the first technique card
      const firstTechniqueCard = page.locator('[data-testid^="technique-card-"]').first()
      const firstTechniqueName = await firstTechniqueCard.locator('h3').textContent()
      await firstTechniqueCard.locator('a').click()
      
      // Should navigate to technique detail page
      await expect(page).toHaveURL(/\/techniques\/[a-z0-9-]+/)
      
      // Verify technique detail page content
      await expect(page.locator('h1')).toContainText(firstTechniqueName || '')
      await expect(page.locator('[data-testid="technique-description"]')).toBeVisible()
      await expect(page.locator('[data-testid="technique-ratings"]')).toBeVisible()
      
      // Verify assurance goals and tags are displayed
      await expect(page.locator('[data-testid="assurance-goals"]')).toBeVisible()
      await expect(page.locator('[data-testid="technique-tags"]')).toBeVisible()
      
      // Navigate back to list
      await page.goBack()
      await expect(page.locator('h1')).toContainText('TEA Techniques')
    })

    test('should display technique acronym when available', async ({ page }) => {
      // Look for techniques with acronyms (like SHAP, LIME)
      const shapeCard = page.locator('[data-testid="technique-card-shapley-additive-explanations"]')
      if (await shapeCard.isVisible()) {
        await expect(shapeCard.locator('text=SHAP')).toBeVisible()
      }
      
      const limeCard = page.locator('[data-testid="technique-card-local-interpretable-model-agnostic-explanations"]')
      if (await limeCard.isVisible()) {
        await expect(limeCard.locator('text=LIME')).toBeVisible()
      }
    })
  })

  test.describe('Search and Filter Journey', () => {
    test('should allow user to search for techniques', async ({ page }) => {
      // Use search functionality
      const searchInput = page.locator('input[placeholder*="search" i]')
      await searchInput.fill('SHAP')
      
      // Wait for search results
      await page.waitForTimeout(500) // Allow for debouncing
      
      // Verify filtered results
      const techniqueCards = page.locator('[data-testid^="technique-card-"]')
      await expect(techniqueCards).toHaveCount.greaterThan(0)
      
      // Results should contain SHAP
      await expect(page.locator('text=SHAP')).toBeVisible()
      
      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
      
      // Should show all techniques again
      await expect(techniqueCards).toHaveCount.greaterThan(1)
    })

    test('should allow user to filter by assurance goal', async ({ page }) => {
      // Select an assurance goal filter
      const goalFilter = page.locator('select[aria-label*="goal" i]')
      await goalFilter.selectOption({ label: 'Explainability' })
      
      // Wait for filter results
      await page.waitForTimeout(500)
      
      // Verify filtered results show only techniques with that goal
      const techniqueCards = page.locator('[data-testid^="technique-card-"]')
      await expect(techniqueCards).toHaveCount.greaterThan(0)
      
      // Should show techniques with explainability goal
      await expect(page.locator('text=Explainability')).toBeVisible()
    })

    test('should allow user to filter by complexity rating', async ({ page }) => {
      // Select complexity filter
      const complexityFilter = page.locator('select[aria-label*="complexity" i]')
      await complexityFilter.selectOption('3')
      
      // Wait for filter results
      await page.waitForTimeout(500)
      
      // Verify filtered results
      const techniqueCards = page.locator('[data-testid^="technique-card-"]')
      await expect(techniqueCards).toHaveCount.greaterThanOrEqual(0)
      
      // If results exist, they should have complexity rating 3
      if (await techniqueCards.count() > 0) {
        await expect(page.locator('text=3/5').first()).toBeVisible()
      }
    })

    test('should combine search and filters effectively', async ({ page }) => {
      // Combine search with filter
      const searchInput = page.locator('input[placeholder*="search" i]')
      await searchInput.fill('interpretable')
      
      const goalFilter = page.locator('select[aria-label*="goal" i]')
      await goalFilter.selectOption({ label: 'Explainability' })
      
      // Wait for combined filter results
      await page.waitForTimeout(500)
      
      // Should show filtered results
      const techniqueCards = page.locator('[data-testid^="technique-card-"]')
      const cardCount = await techniqueCards.count()
      
      // Results should be relevant to both search and filter
      if (cardCount > 0) {
        await expect(page.locator('text=Explainability')).toBeVisible()
      }
    })

    test('should show no results message when no techniques match', async ({ page }) => {
      // Search for something that doesn't exist
      const searchInput = page.locator('input[placeholder*="search" i]')
      await searchInput.fill('NonExistentTechniqueXYZ123')
      
      // Wait for search
      await page.waitForTimeout(500)
      
      // Should show no results message
      await expect(page.locator('text=No techniques found')).toBeVisible()
    })
  })

  test.describe('Create Technique Journey', () => {
    test('should allow user to create a new technique', async ({ page }) => {
      // Navigate to create technique page
      await page.click('a[href="/techniques/create"]')
      await expect(page).toHaveURL('/techniques/create')
      
      // Verify form is present
      await expect(page.locator('h1')).toContainText('Create')
      await expect(page.locator('form')).toBeVisible()
      
      // Fill out basic information
      await page.fill('input[name="name"]', 'Test Technique E2E')
      await page.fill('input[name="acronym"]', 'TTE')
      await page.fill('textarea[name="description"]', 'This is a test technique created during E2E testing to verify the form functionality works correctly.')
      
      // Select ratings
      await page.selectOption('select[name="complexity_rating"]', '3')
      await page.selectOption('select[name="computational_cost_rating"]', '2')
      
      // Select assurance goals
      await page.check('input[name="assurance_goals"][value="1"]') // Explainability
      await page.check('input[name="tags"][value="1"]') // model-agnostic
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should redirect to technique detail page
      await expect(page).toHaveURL(/\/techniques\/test-technique-e2e/)
      await expect(page.locator('h1')).toContainText('Test Technique E2E')
      await expect(page.locator('text=TTE')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      // Navigate to create technique page
      await page.click('a[href="/techniques/create"]')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible()
      
      // Fill in name only
      await page.fill('input[name="name"]', 'Partial Technique')
      await page.click('button[type="submit"]')
      
      // Should still show validation errors for other required fields
      await expect(page.locator('[role="alert"]')).toBeVisible()
    })

    test('should handle form errors gracefully', async ({ page }) => {
      // Navigate to create technique page
      await page.click('a[href="/techniques/create"]')
      
      // Fill form with invalid data
      await page.fill('input[name="name"]', '') // Empty name
      await page.selectOption('select[name="complexity_rating"]', '10') // Invalid rating
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should display error messages
      await expect(page.locator('[role="alert"]')).toBeVisible()
      
      // Form should remain on same page
      await expect(page).toHaveURL('/techniques/create')
    })
  })

  test.describe('Edit Technique Journey', () => {
    test('should allow user to edit existing technique', async ({ page }) => {
      // First, go to a technique detail page
      const techniqueCards = page.locator('[data-testid^="technique-card-"]')
      await techniqueCards.first().locator('a').click()
      
      // Look for edit button
      const editButton = page.locator('a[href*="/edit"], button:has-text("Edit")')
      if (await editButton.isVisible()) {
        await editButton.click()
        
        // Should be on edit page
        await expect(page).toHaveURL(/\/techniques\/[a-z0-9-]+\/edit/)
        
        // Form should be pre-filled with existing data
        const nameInput = page.locator('input[name="name"]')
        await expect(nameInput).not.toHaveValue('')
        
        // Make a change
        await nameInput.fill('Updated Technique Name')
        
        // Save changes
        await page.click('button[type="submit"]')
        
        // Should redirect back to detail page with updated content
        await expect(page.locator('h1')).toContainText('Updated Technique Name')
      }
    })
  })

  test.describe('Responsive Design Journey', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Page should still be usable
      await expect(page.locator('h1')).toBeVisible()
      
      // Techniques should be displayed (possibly in a single column)
      await expect(page.locator('[data-testid^="technique-card-"]')).toHaveCount.greaterThan(0)
      
      // Search and filters should still work
      const searchInput = page.locator('input[placeholder*="search" i]')
      await searchInput.fill('SHAP')
      await page.waitForTimeout(500)
      
      await expect(page.locator('text=SHAP')).toBeVisible()
      
      // Navigation should work
      await page.locator('[data-testid^="technique-card-"]').first().locator('a').click()
      await expect(page).toHaveURL(/\/techniques\/[a-z0-9-]+/)
    })

    test('should work correctly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Verify layout adapts appropriately
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('[data-testid^="technique-card-"]')).toHaveCount.greaterThan(0)
      
      // Multi-column layout should be maintained
      const grid = page.locator('[data-testid="techniques-grid"]')
      await expect(grid).toBeVisible()
    })
  })

  test.describe('Performance Journey', () => {
    test('should load techniques quickly', async ({ page }) => {
      const startTime = Date.now()
      
      // Navigate to home page
      await page.goto('/')
      
      // Wait for techniques to load
      await expect(page.locator('[data-testid^="technique-card-"]')).toHaveCount.greaterThan(0)
      
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time (3 seconds)
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle pagination efficiently', async ({ page }) => {
      // If pagination exists, test it
      const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")')
      
      if (await nextButton.isVisible()) {
        await nextButton.click()
        
        // Should load next page quickly
        await expect(page.locator('[data-testid^="technique-card-"]')).toHaveCount.greaterThan(0)
        
        // URL should update
        await expect(page).toHaveURL(/page=2|p=2/)
      }
    })
  })

  test.describe('Error Handling Journey', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/techniques/', route => route.abort())
      
      // Navigate to techniques page
      await page.goto('/')
      
      // Should show error message
      await expect(page.locator('text=error', { ignoreCase: true })).toBeVisible()
      
      // Error should be user-friendly
      await expect(page.locator('text=try again', { ignoreCase: true })).toBeVisible()
    })

    test('should handle 404 errors appropriately', async ({ page }) => {
      // Navigate to non-existent technique
      await page.goto('/techniques/non-existent-technique-slug')
      
      // Should show 404 page or error message
      await expect(page.locator('text=not found', { ignoreCase: true })).toBeVisible()
      
      // Should provide navigation back to main page
      await expect(page.locator('a[href="/"]')).toBeVisible()
    })
  })

  test.describe('Accessibility Journey', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab') // Search input
      await expect(page.locator('input[placeholder*="search" i]')).toBeFocused()
      
      await page.keyboard.press('Tab') // First filter
      await expect(page.locator('select').first()).toBeFocused()
      
      // Continue tabbing to technique cards
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter')
      
      // Should navigate to technique detail
      await expect(page).toHaveURL(/\/techniques\/[a-z0-9-]+/)
    })

    test('should work with screen reader semantics', async ({ page }) => {
      // Check for proper headings
      await expect(page.locator('h1')).toBeVisible()
      
      // Check for proper labels
      await expect(page.locator('label')).toHaveCount.greaterThan(0)
      
      // Check for proper landmarks
      await expect(page.locator('main')).toBeVisible()
      
      // Links should have accessible names
      const links = page.locator('a[href]')
      const linkCount = await links.count()
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = links.nth(i)
        const accessibleName = await link.getAttribute('aria-label') || await link.textContent()
        expect(accessibleName).toBeTruthy()
      }
    })
  })
})