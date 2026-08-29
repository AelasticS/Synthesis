# Part 3: Configuration-based

Part 2 dissolved one of Part 1's hard-coded choices and left the other
one standing on purpose. `relationshipToStructure` still decides with a
plain `if`: M:N becomes a join table, everything else becomes a foreign
key on the N side.

Read that conditional once more, because its two branches are not the
same kind of statement.

An **M:N relationship has no alternative.** Neither side can hold a
single foreign key value, so a table of its own is the only structure
that can carry the link. That branch is not a decision, it is a
consequence, and it belongs in the code where it is.

A **1:N relationship has two honest answers.** A foreign key on the N
side is compact and cheap to read. A table of its own costs a join on
every query, but it keeps the N side free of the reference and lets the
link be added or dropped without touching either table. Nothing in the
source model settles which is right, because the question is not about
the source model at all. It is about the project.

That distinction is the spine of this part, and it is exactly the line
between Part 2's mechanism and Part 3's:

- **Specialization dispatches on what the source model already says.**
  An entity *is* a `Kernel` or a `Weak`, the model asserts it, and the
  transformation obeys.
- **A configuration decides what the source model leaves open.** A
  relationship is not "a foreign key relationship". Nothing in the
  schema makes it one, and making it one is a choice somebody has to
  take responsibility for.

So Part 3 does not replace Part 2's mechanism, and it does not remove
the conditional either. It splits the conditional along that line: the
forced branch stays plain code, and the open branch becomes a declared
design space that a configuration closes, one run at a time.

## What changes

Four things, and nothing else:

- **The transformation class.** It extends `DecisionAwareM2M` instead
  of `abstractM2M`, and takes the run's configuration model as a third
  constructor argument.
- **The relationship rule.** The 1:N branch becomes a variation point
  (`@VarPoint`) with two options (`@VarOption`), one of them marked
  `@Default()`. The M:N branch is untouched.
- **Three new modules in the package.** A decision model declaring the
  issue and its options, a binding model attaching the issue to the
  `Relationship` concept, and the tutorial EER metamodel expressed as a
  model so the binding has concepts to reference.
- **The manifest.** A `parts` block naming those three modules. Its
  presence is what makes the package configuration-based; there is no
  flag saying so.

## What does not change

The entity rule. `entityToTable` is still a `@SpecPoint` with
`kernelToTable` and `weakToTable` as its `@SpecOption` methods, byte
for byte what Part 2 wrote. The two mechanisms live side by side in one
class, on different methods, deciding different kinds of question.

The sample model does not change either, and neither do the target
metamodel, the attribute rule, the domain-to-SQL-type mapping, or the
build and install loop.

One detail in the fixed logic does move, and page 3 explains why: the
join table's foreign key columns become qualified with the relationship
name, because once a 1:N relationship may also become a join table, one
schema can hold two join tables referencing the same entity.

The finished package exists in the repository as
`examples/eer-tutorial-configuration-based`. Use it as the answer key;
every listing on the following pages is taken from it verbatim.

## Prerequisites

- **Part 2, finished.** This part refactors the code Part 2 built and
  does not repeat how a transformation class, a manifest, a JSX
  template, or a specialization point works.
- The same repository checkout, built once with `rush install` and
  `rush build`, and the `synth` CLI.
- One new dependency in the package, `@synthesis/decision-framework`,
  which is where all four new decorators and all three decision-side
  metamodels come from.
- `"experimentalDecorators": true` in `tsconfig.json`, unchanged from
  Part 2.

## The arc

The four pages follow the order in which the pieces have to exist. The
design space comes first because nothing can be bound to it until it is
declared, the binding second because the transformation's options are
only reachable once the engine knows which elements raise the issue,
the transformation third, and the run last.

1. **[The design space](./1-the-design-space.md)**: the decision model,
   its issues and options, `isDefault`, and the three kinds of issue.
2. **[Binding the issue](./2-binding-the-issue.md)**: why a binding
   model exists at all, the metamodel shipped as a model so the binding
   has something to point at, and the condition that keeps M:N
   relationships out of the decision entirely.
3. **[Variation points](./3-variation-points.md)**: `@VarPoint`,
   `@VarOption` and `@Default()`, Part 2's conditional beside Part 3's
   variation point, and the manifest's `parts` block.
4. **[Running with configurations](./4-running-with-configurations.md)**:
   why a run refuses to apply defaults silently, `--default-configs`,
   `config init`, the one-line edit that flips the choice, and the two
   generated schemas side by side.
