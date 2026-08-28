# Tutorial drafts (developer guide)

Drafts of the transformation-authoring tutorial for the developer guide.
They are staged here because the documentation site structure is settled
on the docs branch but not merged yet; once it lands, these pages move
into the reserved slot at `apps/docs/docs/developer-guide/tutorial/`.

- [Part I: your first transformation](./01-first-transformation.md).
  Builds a minimal model-to-model transformation from `transformation
  init` to a provenance-stamped output model. Companion and answer key:
  [examples/rel-copy](../examples/rel-copy/).
- [Part II: decision-based transformations](./02-decision-based-transformations.md).
  Adds a decision model, a binding model, manifest parts, and
  configuration-driven runs. Companion and answer key:
  [examples/eer-to-relational](../examples/eer-to-relational/).

Every command and every output snippet in these drafts was executed
against the current CLI; the companion examples are smoke tested in CI,
so the tutorial's final states stay verified code, not prose.

Review notes:

- Both parts assume the reader works inside a checkout of this
  repository, because `@synthesis/*` packages are not published to npm
  yet; dependency snippets use `workspace:*`. When packages are
  published, the same text works standalone after swapping the ranges,
  and the note in each part's prerequisites section can be dropped.
- A possible Part III (text generation, companion rel-to-sql-ddl) is
  deliberately out of scope for this draft round.
