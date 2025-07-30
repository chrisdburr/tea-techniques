# TEA Techniques Article

This directory contains the source files for an arXiv preprint introducing the
TEA Techniques dataset and interactive web app.

## Structure

- `tea-techniques-article.md`: main article in Pandoc markdown (includes YAML
  frontmatter)
- `references.bib`: bibliography file with all citations
- `pandoc-config.yaml`: Pandoc conversion configuration
- `figures/`: directory containing figures and diagrams
- `output/`: generated output files (PDF, LaTeX)

## Building the Article

Generate PDF:

```bash
pandoc tea-techniques-article.md -o output/tea-techniques-article.pdf --bibliography=references.bib --citeproc --pdf-engine=xelatex -V geometry:margin=2.5cm
```

Generate LaTeX (for arXiv submission):

```bash
pandoc tea-techniques-article.md -o output/tea-techniques-article.tex --bibliography=references.bib --citeproc --standalone
```
