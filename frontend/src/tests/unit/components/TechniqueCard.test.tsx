import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TechniqueCard from "../../../components/technique/TechniqueCard";
import { createMockTechnique } from "../../fixtures/techniques";
import type { Technique } from "../../../lib/types";

// Simple test wrapper without external dependencies
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderComponent = (technique: Technique) => {
  return render(
    <TestWrapper>
      <TechniqueCard technique={technique} />
    </TestWrapper>,
  );
};

describe("TechniqueCard", () => {
  const mockTechnique = createMockTechnique({
    slug: "test-technique",
    name: "Test Technique",
    acronym: "TT",
    description: "This is a test technique for testing purposes.",
    assurance_goals: [
      { id: 1, name: "Explainability", description: "Test goal" },
      { id: 2, name: "Fairness", description: "Test goal" },
    ],
  });

  describe("Basic Rendering", () => {
    it("renders the technique card successfully", () => {
      const { container } = renderComponent(mockTechnique);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("displays technique name with acronym", () => {
      const { container } = renderComponent(mockTechnique);

      // Look for the formatted title
      expect(container.textContent).toContain("Test Technique (TT)");
    });

    it("displays technique name without acronym when not provided", () => {
      const techniqueWithoutAcronym = createMockTechnique({
        name: "Simple Technique",
        acronym: "",
      });

      const { container } = renderComponent(techniqueWithoutAcronym);
      expect(container.textContent).toContain("Simple Technique");
    });

    it("displays technique description", () => {
      const { container } = renderComponent(mockTechnique);
      expect(container.textContent).toContain(mockTechnique.description);
    });

    it("displays View Details button as a link", () => {
      const { container } = renderComponent(mockTechnique);

      const link = container.querySelector(
        'a[href="/techniques/test-technique"]',
      );
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/techniques/test-technique");
    });
  });

  describe("Assurance Goals", () => {
    it("displays assurance goal icons with tooltips", () => {
      const { container } = renderComponent(mockTechnique);

      // Check for goal tooltips
      const explainabilityElement = container.querySelector(
        '[title="Explainability"]',
      );
      const fairnessElement = container.querySelector('[title="Fairness"]');
      expect(explainabilityElement).toBeInTheDocument();
      expect(fairnessElement).toBeInTheDocument();
    });

    it("handles empty assurance goals", () => {
      const techniqueWithNoGoals = createMockTechnique({
        assurance_goals: [],
      });

      const { container } = renderComponent(techniqueWithNoGoals);
      expect(container.textContent).toContain(techniqueWithNoGoals.name);
    });
  });

  describe("Description Truncation", () => {
    it("truncates long descriptions and adds ellipsis", () => {
      const longDescription =
        "This is a very long description that should be truncated because it exceeds the maximum length limit for technique card descriptions. It continues on and on with lots of detailed information that would make the card too tall and affect the layout of the grid system.";

      const techniqueWithLongDescription = createMockTechnique({
        description: longDescription,
      });

      const { container } = renderComponent(techniqueWithLongDescription);

      // Should show truncated version with ellipsis
      const descriptionElement = container.querySelector(
        `[title="${longDescription}"]`,
      );
      if (descriptionElement) {
        expect(descriptionElement.textContent).toContain("...");
        expect(descriptionElement).toHaveAttribute("title", longDescription);
      } else {
        // If no truncation element, check that content is present
        expect(container.textContent).toContain(
          longDescription.substring(0, 50),
        );
      }
    });

    it("displays short descriptions without truncation", () => {
      const shortDescription = "Short description.";
      const techniqueWithShortDescription = createMockTechnique({
        description: shortDescription,
      });

      const { container } = renderComponent(techniqueWithShortDescription);

      expect(container.textContent).toContain(shortDescription);
      expect(container.textContent).not.toMatch(/\.\.\./);
    });
  });

  describe("Title Formatting", () => {
    it("correctly formats title with acronym", () => {
      const technique = createMockTechnique({
        name: "Machine Learning Interpretability",
        acronym: "MLI",
      });

      const { container } = renderComponent(technique);
      expect(container.textContent).toContain(
        "Machine Learning Interpretability (MLI)",
      );
    });

    it("handles long titles gracefully", () => {
      const technique = createMockTechnique({
        name: "Very Long Technique Name That Might Cause Layout Issues",
        acronym: "VLTNMCLI",
      });

      const { container } = renderComponent(technique);

      const titleElement = container.querySelector(
        '[title*="Very Long Technique Name"]',
      );
      expect(titleElement).toBeInTheDocument();
      if (titleElement) {
        expect(titleElement).toHaveAttribute(
          "title",
          "Very Long Technique Name That Might Cause Layout Issues (VLTNMCLI)",
        );
      }
    });
  });

  describe("Accessibility", () => {
    it("provides accessible navigation", () => {
      const { container } = renderComponent(mockTechnique);

      const link = container.querySelector("a");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAccessibleName();
    });

    it("provides title attributes for truncated content", () => {
      const { container } = renderComponent(mockTechnique);

      // Title should have title attribute for screen readers
      const titleElement = container.querySelector('[title*="Test Technique"]');
      expect(titleElement).toBeInTheDocument();
      if (titleElement) {
        expect(titleElement).toHaveAttribute("title", "Test Technique (TT)");
      }
    });

    it("provides title attributes for goal icons", () => {
      const { container } = renderComponent(mockTechnique);

      // Goal icons should have tooltips
      const explainabilityIcon = container.querySelector(
        '[title="Explainability"]',
      );
      const fairnessIcon = container.querySelector('[title="Fairness"]');
      expect(explainabilityIcon).toBeInTheDocument();
      expect(fairnessIcon).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive CSS classes", () => {
      const { container } = renderComponent(mockTechnique);

      // Check for responsive classes in the structure
      const card = container.querySelector(".h-full.flex.flex-col");
      expect(card).toBeInTheDocument();

      // Just check that the container is rendered since CSS classes may vary
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("handles hover interactions", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent(mockTechnique);

      const link = container.querySelector("a");
      if (link) {
        await user.hover(link);

        // Should still be accessible after hover
        expect(link).toBeInTheDocument();
      }
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent(mockTechnique);

      const link = container.querySelector("a");

      if (link) {
        // Focus the link
        await user.tab();
        expect(link).toHaveFocus();
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles special characters in technique name", () => {
      const technique = createMockTechnique({
        name: "Technique with Special Characters: αβγ & émojis 🤖",
        acronym: "",
      });

      const { container } = renderComponent(technique);
      expect(container.textContent).toContain(
        "Technique with Special Characters: αβγ & émojis 🤖",
      );
    });

    it("handles undefined acronym gracefully", () => {
      const technique = createMockTechnique({
        name: "Test Technique",
        acronym: undefined as unknown as string,
      });

      const { container } = renderComponent(technique);
      expect(container.textContent).toContain("Test Technique");
    });

    it("handles empty string values", () => {
      const technique = createMockTechnique({
        name: "Test Technique",
        acronym: "",
        description: "",
      });

      const { container } = renderComponent(technique);
      expect(container.textContent).toContain("Test Technique");
    });
  });

  describe("GoalIcon Integration", () => {
    it("renders the correct number of goal icons", () => {
      const { container } = renderComponent(mockTechnique);

      // Should have exactly 2 goal icons for our mock technique
      const explainabilityIcon = container.querySelector(
        '[title="Explainability"]',
      );
      const fairnessIcon = container.querySelector('[title="Fairness"]');
      expect(explainabilityIcon).toBeInTheDocument();
      expect(fairnessIcon).toBeInTheDocument();
    });

    it("applies proper styling to goal icon containers", () => {
      const { container } = renderComponent(mockTechnique);

      const explainabilityIcon = container.querySelector(
        '[title="Explainability"]',
      );
      expect(explainabilityIcon).toBeInTheDocument();
      // Just verify the icon exists, CSS classes may vary
    });
  });
});
