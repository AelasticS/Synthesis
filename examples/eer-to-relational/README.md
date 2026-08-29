# eer-to-relational

The flagship configuration-based transformation: an EER schema becomes a
relational schema, and the design questions that have no single right
answer are left open as explicit decisions, closed per run by a
configuration model. Three issues are on offer:

- OneToManyStrategy: implement a 1:N relationship as a foreign key or as
  a join table (per relationship).
- PrimaryKeyStrategy: auto increment or manual keys (per attribute).
- NamingConvention: camelCase or snake_case identifiers (whole model).

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): the transformation
  class. Each open issue is a `@VarPoint` method; each admissible answer
  is a `@VarOption` method. The engine dispatches to the option selected
  by the run's configuration model.
- [src/decision-model.tsx](./src/decision-model.tsx): the design space as
  data (issues, options, defaults). `transformation show` reads it.
- [src/binding-model.tsx](./src/binding-model.tsx): connects issues to
  the metamodel concepts they apply to, optionally narrowed by a
  condition (here: only 1:N relationships raise OneToManyStrategy).
- [src/er-metamodel.tsx](./src/er-metamodel.tsx): the EER metamodel as a
  types-metamodel model, shipped as a manifest part so the binding model
  can reference its concepts.
- [synth.json](./synth.json): the manifest. The `parts` block lists the
  three modules above with package-relative paths; they are rendered
  into the store, in order, before every run.
- [sample/library.tsx](./sample/library.tsx): a small EER schema (Book,
  Author, a 1:N writtenBy relationship) to run the transformation on.

## Try it

```bash
# Build the package (from the repository root: rush build -t eer-to-relational)
npm run build

# Set up a workspace and import the sample model
synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

# Install; show reports the manifest facts, including variability: yes
synth transformation install .
synth transformation show eer-to-relational

# Run with the declared defaults (JoinTable, UseAutoIncrement, SnakeCase)
synth transformation run eer-to-relational --in demo/library --default-configs --out demo/library-rel
synth model show demo/library-rel
```

The default run produces snake_case tables `book` and `author` plus a
join table `written_by` with two foreign key columns.

## Choosing differently

Generate an editable configuration, flip a decision, and run again:

```bash
synth config init eer-to-relational --for demo/library --out demo/library-cfg
# edit the configuration model: select ForeignKey for OneToManyStrategy
synth transformation run eer-to-relational --in demo/library --config demo/library-cfg --out demo/library-rel-fk
```

With ForeignKey selected, the join table disappears; instead the `book`
table (the N side) gains a `written_by_author_id_fk` column referencing
`author`. Foreign key columns carry the relationship name because
element names are unique across the whole model, not per table. Same
source model, same transformation, different architecture: that is the
variability mechanism in one picture.

## What to look at next

[rel-copy](../rel-copy/) shows the same package mechanics at minimal
size, without variability.
