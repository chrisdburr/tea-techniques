import { axe, toHaveNoViolations } from 'jest-axe'
import { RenderResult } from '@testing-library/react'
import { expect } from 'vitest'

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Custom axe configuration for TEA Techniques project
export const teaAxeConfig = {
  rules: {
    // Core accessibility rules (always enabled)
    'alt-text': { enabled: true },
    'aria-roles': { enabled: true },
    'button-name': { enabled: true },
    'color-contrast': { 
      enabled: process.env.NODE_ENV === 'production',
      options: { 
        noScroll: true,
        // Allow lower contrast for non-critical elements in development
        contrastRatio: process.env.NODE_ENV === 'production' ? { normal: 4.5, large: 3 } : { normal: 3, large: 2.5 }
      }
    },
    'duplicate-id': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'heading-order': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },

    // Rules to disable for test environments
    'landmark-one-main': { enabled: false }, // Components may not have main landmarks
    'page-has-heading-one': { enabled: false }, // Individual components may not have h1
    'region': { enabled: false }, // Components may not define regions
    'bypass': { enabled: false }, // Skip links not needed in component tests

    // TEA-specific customizations
    'focus-order-semantics': { enabled: true },
    'tabindex': { enabled: true },
    'aria-hidden-focus': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  // Include best practices but not experimental rules
  includedImpacts: ['minor', 'moderate', 'serious', 'critical'],
}

// Test accessibility of a rendered component
export const testAccessibility = async (
  renderResult: RenderResult,
  customConfig = {}
) => {
  const config = { ...teaAxeConfig, ...customConfig }
  const results = await axe(renderResult.container, config)
  
  // Custom formatting for better error messages
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map(violation => 
      `${violation.id}: ${violation.description}\n` +
      `  Impact: ${violation.impact}\n` +
      `  Help: ${violation.helpUrl}\n` +
      `  Elements: ${violation.nodes.map(node => node.target.join(' > ')).join(', ')}`
    ).join('\n\n')
    
    throw new Error(`Accessibility violations found:\n\n${violationMessages}`)
  }
  
  expect(results).toHaveNoViolations()
  return results
}

// Test specific accessibility aspects
export const accessibilityTests = {
  // Test keyboard navigation
  keyboardNavigation: async (renderResult: RenderResult) => {
    return testAccessibility(renderResult, {
      rules: {
        'keyboard-navigation': { enabled: true },
        'tabindex': { enabled: true },
        'focus-order-semantics': { enabled: true },
      }
    })
  },

  // Test screen reader compatibility
  screenReader: async (renderResult: RenderResult) => {
    return testAccessibility(renderResult, {
      rules: {
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'label': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true },
      }
    })
  },

  // Test color and contrast
  colorContrast: async (renderResult: RenderResult) => {
    return testAccessibility(renderResult, {
      rules: {
        'color-contrast': { 
          enabled: true,
          options: { 
            noScroll: true,
            contrastRatio: { normal: 4.5, large: 3 }
          }
        },
        'color-contrast-enhanced': { enabled: true },
      }
    })
  },

  // Test form accessibility
  forms: async (renderResult: RenderResult) => {
    return testAccessibility(renderResult, {
      rules: {
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'input-image-alt': { enabled: true },
        'required-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
      }
    })
  },

  // Test heading structure
  headings: async (renderResult: RenderResult) => {
    return testAccessibility(renderResult, {
      rules: {
        'heading-order': { enabled: true },
        'empty-heading': { enabled: true },
        'p-as-heading': { enabled: true },
      }
    })
  },
}

// Utility functions for accessibility testing
export const accessibilityUtils = {
  // Find all focusable elements
  findFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        const element = el as HTMLElement
        return element.offsetWidth > 0 && element.offsetHeight > 0
      }) as HTMLElement[]
  },

  // Test tab order
  testTabOrder: async (
    container: HTMLElement,
    expectedOrder: string[] // Array of test-ids or aria-labels
  ) => {
    const focusableElements = accessibilityUtils.findFocusableElements(container)
    
    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedElement = container.querySelector(`[data-testid="${expectedOrder[i]}"], [aria-label="${expectedOrder[i]}"]`) as HTMLElement
      
      if (!expectedElement) {
        throw new Error(`Expected element with testid or aria-label "${expectedOrder[i]}" not found`)
      }
      
      const actualIndex = focusableElements.indexOf(expectedElement)
      if (actualIndex !== i) {
        throw new Error(`Tab order mismatch: expected ${expectedOrder[i]} at position ${i}, but found at position ${actualIndex}`)
      }
    }
  },

  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement): boolean => {
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    const title = element.getAttribute('title')
    const textContent = element.textContent?.trim()

    return !!(ariaLabel || ariaLabelledBy || title || textContent)
  },

  // Get accessible name of element
  getAccessibleName: (element: HTMLElement): string => {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    // Check aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      if (labelElement) return labelElement.textContent?.trim() || ''
    }

    // Check title attribute
    const title = element.getAttribute('title')
    if (title) return title

    // Fallback to text content
    return element.textContent?.trim() || ''
  },

  // Check if element is keyboard accessible
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex')
    
    // Elements with tabindex="-1" are not keyboard accessible
    if (tabIndex === '-1') return false
    
    // Interactive elements are keyboard accessible by default
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'a']
    if (interactiveElements.includes(element.tagName.toLowerCase())) {
      return !element.hasAttribute('disabled')
    }
    
    // Elements with positive tabindex are keyboard accessible
    return tabIndex !== null && parseInt(tabIndex) >= 0
  },
}

// Accessibility test helpers for common components
export const componentAccessibilityTests = {
  // Test button accessibility
  button: async (renderResult: RenderResult, buttonTestId: string) => {
    const button = renderResult.getByTestId(buttonTestId)
    
    // Check if button has accessible name
    if (!accessibilityUtils.hasAccessibleName(button)) {
      throw new Error('Button must have an accessible name (aria-label, text content, or title)')
    }
    
    // Check if button is keyboard accessible
    if (!accessibilityUtils.isKeyboardAccessible(button)) {
      throw new Error('Button must be keyboard accessible')
    }
    
    return testAccessibility(renderResult)
  },

  // Test form accessibility
  form: async (renderResult: RenderResult, formTestId: string) => {
    const form = renderResult.getByTestId(formTestId)
    const inputs = form.querySelectorAll('input, select, textarea')
    
    // Check if all form controls have labels
    inputs.forEach((input, index) => {
      const htmlInput = input as HTMLElement
      if (!accessibilityUtils.hasAccessibleName(htmlInput)) {
        throw new Error(`Form control at index ${index} must have a label`)
      }
    })
    
    return accessibilityTests.forms(renderResult)
  },

  // Test modal/dialog accessibility
  modal: async (renderResult: RenderResult, modalTestId: string) => {
    const modal = renderResult.getByTestId(modalTestId)
    
    // Check if modal has role="dialog"
    const role = modal.getAttribute('role')
    if (role !== 'dialog' && role !== 'alertdialog') {
      throw new Error('Modal must have role="dialog" or role="alertdialog"')
    }
    
    // Check if modal has accessible name
    if (!accessibilityUtils.hasAccessibleName(modal)) {
      throw new Error('Modal must have an accessible name (aria-label or aria-labelledby)')
    }
    
    return testAccessibility(renderResult)
  },

  // Test list accessibility
  list: async (renderResult: RenderResult, listTestId: string) => {
    return testAccessibility(renderResult, {
      rules: {
        'list': { enabled: true },
        'listitem': { enabled: true },
      }
    })
  },
}

// Export the main axe function for custom usage
export { axe } from 'jest-axe'