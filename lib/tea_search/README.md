# TEA Search Multi-Agent Pipeline

A native Claude Code multi-agent workflow for AI technique resource discovery and enrichment.

## Overview

This pipeline automatically discovers, evaluates, and selects high-quality resources for AI assurance techniques using a coordinated multi-agent architecture.

## Architecture

```
/enrich-techniques command
    ↓
Technique Enrichment Orchestrator (manages parallel processing)
    ↓
TEA Search Agents (one per technique)
    ↓
├── Search Phase (4 providers in parallel)
├── Evaluation Subagent (assess relevance)
└── Selection Subagent (choose best 5)
    ↓
Updated technique JSON with resources
```

## Quick Start

### 1. Prerequisites

Configure API keys in `.env`:
```bash
GITHUB_API_KEY=...          # Required for GitHub search
GOOGLE_API_KEY=...          # Required for Google search
GOOGLE_CSE_ID=...           # Required for Google search
ARXIV_API_KEY=...           # Optional
SEMANTIC_SCHOLAR_API_KEY=... # Optional
```

### 2. Basic Usage

Enrich a single technique:
```bash
/enrich-techniques test/techniques/sample-technique.json
```

Process multiple techniques:
```bash
/enrich-techniques tech1.json,tech2.json,tech3.json
```

### 3. Expected Output

Techniques are enriched with a `resources` array:
```json
{
  "slug": "differential-privacy",
  "name": "Differential Privacy",
  "description": "...",
  "assurance_goals": ["privacy", "security"],
  "resources": [
    {
      "title": "The Algorithmic Foundations of Differential Privacy",
      "url": "https://arxiv.org/abs/...",
      "type": "paper",
      "relevance_score": 0.95,
      "description": "Foundational paper on differential privacy",
      "key_insights": ["Formal guarantees", "..."]
    }
  ],
  "resources_updated": "2025-01-29T14:30:00Z",
  "resources_count": 5,
  "search_id": "20250129_143025_a1b2c3d4"
}
```

## Components

### Slash Command
- **Location**: `.claude/commands/enrich-techniques.md`
- **Purpose**: Entry point for technique enrichment
- **Features**: Input validation, orchestrator invocation

### Agents

#### Technique Enrichment Orchestrator
- **Location**: `.claude/agents/technique-enrichment-orchestrator.md`
- **Purpose**: Manages parallel processing of multiple techniques
- **Features**: Batch processing, progress tracking, error handling

#### TEA Search Agent
- **Location**: `.claude/agents/tea-search.md`
- **Purpose**: Coordinates complete pipeline for single technique
- **Features**: Search coordination, subagent management, JSON updates

#### Evaluate Resource Agent
- **Location**: `.claude/agents/evaluate-resource.md`
- **Purpose**: Assesses resource relevance and quality
- **Features**: Scoring (0-1), type classification, insight extraction

#### Select Resources Agent
- **Location**: `.claude/agents/select-resources.md`
- **Purpose**: Selects best 5 resources ensuring diversity
- **Features**: Ranking, diversity rules, quality thresholds

### Python Modules

#### Search Providers
- `modules/search/arxiv.py`: Academic papers from arXiv
- `modules/search/github.py`: Code repositories and tools
- `modules/search/google.py`: General web resources
- `modules/search/semantic_scholar.py`: Academic papers with citations

#### Utilities
- `modules/utils/io.py`: File I/O, search ID generation, result tracking
- `config.py`: API key management, provider configuration
- `models.py`: Data models and validation

## Results Structure

All results are tracked with unique search IDs:

```
lib/tea-search/results/
├── search/{search_id}/         # Raw search results
│   ├── arxiv_{search_id}.json
│   ├── github_{search_id}.json
│   ├── google_{search_id}.json
│   └── semantic_scholar_{search_id}.json
├── evaluated/{search_id}/      # Evaluation results
│   └── evaluated_{search_id}.json
├── selected/{search_id}/       # Final selections
│   └── selected_{search_id}.json
└── logs/                       # Processing logs
    └── orchestration_YYYYMMDD_HHMMSS.json
```

## Testing

Run component tests:
```bash
uv run python test_phase2.py
```

Test individual search module:
```bash
uv run python -m lib.tea-search.modules.search.arxiv \
  '{"name": "Test", "description": "Test description", "assurance_goals": ["test"]}' 5
```

## Performance

- **Single technique**: 30-60 seconds
- **Parallel processing**: Up to 5 techniques concurrently
- **Typical results**: 50-70 resources searched, 5 selected
- **Success rate**: >95% with proper API configuration

## Troubleshooting

### API Key Issues
- Verify keys in `.env` file
- Check rate limits aren't exceeded
- Some providers work without keys (ArXiv, limited GitHub)

### No Results Found
- Technique description may be too specific
- Try broader search terms in description
- Check provider availability

### Slow Processing
- Normal: 30-60 seconds per technique
- API rate limits may cause delays
- Network issues can affect performance

## Development

### Adding New Search Providers
1. Create module in `modules/search/`
2. Implement search function with standard interface
3. Add configuration in `config.py`
4. Update TEA Search agent to include provider

### Customizing Selection Criteria
Edit `.claude/agents/select-resources.md`:
- Adjust relevance threshold (default: 0.6)
- Modify diversity rules
- Change maximum resources (default: 5)

## License

Part of the TEA Techniques project. See main LICENSE file.