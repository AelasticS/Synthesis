# Part 2: Advanced

Part 1 mapped every entity the same way. One rule, `entityToTable`,
produced one shape of table: the entity's name, and one column per
attribute. That is the right rule as long as every entity really is the
same kind of thing.

In EER it is not. A **kernel entity** stands on its own: it has a key
of its own, and a row in its table is identified by that key and
nothing else. A **weak entity** does not. A physical copy of a book is
copy number 3 *of some book*; the copy number alone identifies nothing.
Its table needs a foreign key to the owner, and that column has to take
part in the primary key. Two kinds of source element, two different
tables.

You could write that as a type check inside `entityToTable`, and the
result would work. Part 2 does something else: it hands the choice to
the framework. The rule is split into a base rule that produces what
every table shares and one specialized rule per entity subtype, and the
engine picks the specialized rule by looking at the runtime type of the
source element. The dispatch is not written anywhere; it follows from
the metamodel's subtype hierarchy.

## What changes

Three things, and nothing else:

- **The source metamodel.** Part 2 moves to the advanced tutorial EER
  metamodel, which adds `Kernel` and `Weak` as subtypes of `Entity`,
  and gives a weak entity an `owner` link to the entity that completes
  its key.
- **The sample model.** `Book`, `Author`, and `Publisher` are written
  as kernel entities, and a weak entity `BookCopy` is added, owned by
  `Book`.
- **The entity rule.** `entityToTable` becomes a specialization point
  (`@SpecPoint`), and two new methods (`kernelToTable` and
  `weakToTable`) register as its options (`@SpecOption`) for the two
  subtypes.

## What does not change

The relationship logic is untouched. `relationshipToStructure` still
decides with the same plain `if`: M:N becomes a join table, everything
else becomes a foreign key on the N side. That is deliberate, and it is
the point of the distinction this part draws.

Specialization answers questions the source model has already answered.
A weak entity is a weak entity; the model says so, and no setting
should be able to say otherwise. Whether a 1:N relationship is better
served by a foreign key or by a separate table is a different kind of
question: the model does not answer it, both answers are defensible,
and the right one depends on the project. Specialization cannot express
that, because there is no source subtype to dispatch on. Part 3 takes
it up with a configuration-based rule.

Everything else from Part 1 carries over unexamined: the target
metamodel, the attribute rule, the domain-to-SQL-type mapping, the
manifest, and the build, install, run loop.

The finished package exists in the repository as
`examples/eer-tutorial-advanced`. Use it as the answer key; every
listing on the following pages is taken from it verbatim.

## Prerequisites

- **Part 1, finished.** This part is a refactoring of the code Part 1
  built. It does not repeat how a transformation class, a manifest, or
  a JSX template works.
- The same repository checkout, built once with `rush install` and
  `rush build`, and the `synth` CLI.
- One new build setting: `"experimentalDecorators": true` in the
  package's `tsconfig.json`. Page 3 shows where it goes.

## The arc

1. **[The entity subtypes](./1-entity-subtypes.md)**: the advanced
   metamodel stage, what `Kernel` and `Weak` add over the basic stage,
   and why the owner link is what makes a weak entity mappable at all.
2. **[Specialization](./2-specialization.md)**: `@SpecPoint` and
   `@SpecOption`, the order the decorators have to be written in, and
   the four rules of the dispatch and merge semantics.
3. **[The refactor](./3-the-refactor.md)**: Part 1's single rule beside
   Part 2's three, the run, and the generated model with the weak
   entity's table in it.
