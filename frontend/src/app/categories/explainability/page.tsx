import { CategoryPageTemplate } from "@/components/categories/CategoryPageTemplate";

export default function ExplainabilityPage() {
  return (
    <CategoryPageTemplate
      goalName="Explainability"
      goalDescription="Techniques that aim to make AI models more interpretable and their decisions more understandable to humans. These techniques help identify how models transform inputs into outputs, which features are most important for predictions, and why specific decisions are made."
    />
  );
}
