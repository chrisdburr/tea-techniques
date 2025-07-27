## Done

- [x] Fix logo
- [x] Remove common tags component from categories/\* pages
- [x] Remove Overview component from categories/ route
- [x] categories/security/ returns an error — this is probably because there are
      no security techniques in the original dataset.
  - Two options: 1) implement a better 404 page for when no techniques or tag
    routes return options, 2) (preferred) update the original dataset to have
    some techniques labelled as security and then rerun the data creation script
- [x] docs/ route needs an index page
- [x] about/tag-definitions/ appears to have a different layout to
      about/technique-evaluation/ and about/project-info/
  - This may be a good opportunity to define a common page layout for
    predominantly text-based pages (e.g. docs and about) which uses consistent
    styling and typography (using shadcn components to ensure consistency)
- [x] Check why about/tag-definitions/ has different padding to other two about
      pages
- [x] Update logo usage
- [x] Review layout of techniques pages
- [x] Centre settings logo
- [x] Find common layout for index pages (e.g. sections versus cards)
- [x] Switch to mdx for all docs and about pages
- [x] Bundle analysis, performance testing, and optimisation (Phase 1 Complete)
- [x] Run linter on all files
- [x] filters/ route needs to be updated to get rid of cards in favour of
      sections that explain each of the filters and then provide a list of the
      tag prefixes' contents (e.g. model-type/cnn)
- [x] Simplify mdx pages
- [x] Fix filter 404 pages
- [x] Review API documentation
- [x] Add scrolling sidebar to about/ and docs/ pages
- [x] Add a schema for the techniques JSON files to reference in the
      documentation (e.g. community-contributions), possibly a template file as
      well.
- [x] Setup CI/CD pipeline and workflows
- [x] Lint, format, types, perf, build (final checks)

## Next

- [ ] Review contribution doc
- [ ] Review about pages
- [ ] Deploy to GH pages
- [ ] GitHub release and docker images

## Future

- [ ] Figure out good governance strategy for tags definitions, given reuse
      across several pages
- [ ] Create local deployment doc
- [ ] Import TEA docs
