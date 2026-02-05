import { getAllTechniques, getAssuranceGoals, getTags } from '@/lib/data';

/**
 * Displays dynamic entity counts for the Knowledge Graph documentation.
 * Data is loaded at build time (server component).
 */
export async function KnowledgeGraphStats() {
  const [techniques, goals, tags] = await Promise.all([
    getAllTechniques(),
    getAssuranceGoals(),
    getTags(),
  ]);

  // Count unique resources across all techniques
  const resourceKeys = new Set<string>();
  for (const technique of techniques) {
    if (technique.resources) {
      for (const resource of technique.resources) {
        // Resources can be either Resource objects or strings (citation keys)
        const key =
          typeof resource === 'string' ? resource : resource.citationKey;
        if (key) {
          resourceKeys.add(key);
        }
      }
    }
  }

  const stats = {
    techniques: techniques.length,
    goals: goals.length,
    tags: tags.length,
    resources: resourceKeys.size,
  };

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-semibold">Entity</th>
            <th className="px-4 py-2 text-left font-semibold">Count</th>
            <th className="px-4 py-2 text-left font-semibold">Description</th>
            <th className="px-4 py-2 text-left font-semibold">Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="px-4 py-2 font-medium">Technique</td>
            <td className="px-4 py-2">{stats.techniques}</td>
            <td className="px-4 py-2 text-muted-foreground">
              AI assurance methods with metadata and ratings
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              SHAP, LIME, Differential Privacy
            </td>
          </tr>
          <tr className="border-b">
            <td className="px-4 py-2 font-medium">Assurance Goal</td>
            <td className="px-4 py-2">{stats.goals}</td>
            <td className="px-4 py-2 text-muted-foreground">
              High-level objectives a technique addresses
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              Explainability, Fairness, Privacy
            </td>
          </tr>
          <tr className="border-b">
            <td className="px-4 py-2 font-medium">Tag</td>
            <td className="px-4 py-2">{stats.tags}</td>
            <td className="px-4 py-2 text-muted-foreground">
              Hierarchical classification taxonomy
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              <code className="rounded bg-secondary px-1 py-0.5 text-sm">
                model-agnostic
              </code>
              ,{' '}
              <code className="rounded bg-secondary px-1 py-0.5 text-sm">
                neural-network
              </code>
            </td>
          </tr>
          <tr className="border-b">
            <td className="px-4 py-2 font-medium">Resource</td>
            <td className="px-4 py-2">{stats.resources}</td>
            <td className="px-4 py-2 text-muted-foreground">
              Academic papers, software, and documentation
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              Research papers, Python packages
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
