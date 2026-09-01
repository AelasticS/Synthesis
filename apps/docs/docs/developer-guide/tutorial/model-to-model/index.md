# Model-to-model transformations

A model-to-model transformation reads a source model written in one
metamodel and produces a target model written in another. This tutorial
uses the case every modelling course starts with, because its rules are
familiar and its hard questions are real: an Extended
Entity-Relationship (EER) schema becomes a relational schema. Entities
become tables, attributes become columns, and relationships become
foreign keys or join tables depending on their cardinality.

The tutorial is built around a single observation. The mapping rules
you would write by hand are almost entirely mechanical, except for a
handful of places where the source model does not determine the answer.
Whether a 1:N relationship becomes a foreign key or a join table is a
design decision, not a deduction. Everything the four parts add is
machinery for handling exactly those places well.

## The four parts

Each part starts from the transformation the previous part finished
with and changes one thing about how its rules are organized.

### Part 1: Basic

**Available now.**
[Start here](./part-1-basic/index.md).

A complete transformation with fixed logic and no decorators. You meet
the source metamodel, the target metamodel, JSX model authoring, the
transformation class, the `synth.json` manifest, and the loop of build,
install, and run. The relationship mapping is decided by one plain
`if` statement: M:N becomes a join table, everything else becomes a
foreign key on the N side. That conditional is deliberate, and the next
two parts each dissolve it in a different way.

Answer key: `examples/tutorial/eer-tutorial-basic`.

### Part 2: Advanced

**Available now.**
[Continue here](./part-2-advanced/index.md).

The source metamodel grows the `Kernel` and `Weak` entity subtypes, and
the entity rule stops being one function that inspects its argument.
Instead it becomes a specialization point (`@SpecPoint`) with one
specialized implementation (`@SpecOption`) per subtype, dispatched by
the engine on the runtime type of the source element. This is the right
mechanism when the variants are determined by the source model: a weak
entity is a weak entity, and no configuration should be able to say
otherwise.

Answer key: `examples/tutorial/eer-tutorial-advanced`, which uses
`eer-tutorial-metamodel/advanced` as its source
metamodel.

### Part 3: Configuration-based

**Available now.**
[Continue here](./part-3-configuration-based/index.md).

What remains after Part 2 is the genuinely open case: the relationship
cardinality decisions. Part 3 turns them into a declared design space.
A decision model states the issues and their admissible options, a
binding model attaches each issue to the metamodel concepts it
concerns, and a configuration model closes the decisions for one
concrete run. The transformation declares variation points
(`@VarPoint`) and their options (`@VarOption`), and the engine
dispatches on the configuration rather than on an `if` statement. The
same source model and the same transformation then produce different
relational architectures.

Answer key: `examples/tutorial/eer-tutorial-configuration-based`.

### Part 4: Higher-order templates

**In preparation.**

Templates that take templates as parameters, so families of
structurally different targets come from one definition. This is how
recurring shapes (audit columns, history tables, naming schemes) are
factored out of individual rules and applied uniformly.

## At a glance

| Part | What decides the mapping | Mechanism | Status |
| --- | --- | --- | --- |
| 1: Basic | A hand written conditional in the rule | Plain TypeScript | Available |
| 2: Advanced | The runtime type of the source element | `@SpecPoint` and `@SpecOption` | Available |
| 3: Configuration-based | A configuration chosen for the run | Decision model, binding model, `@VarPoint` and `@VarOption` | Available |
| 4: Higher-order templates | A template passed as a parameter | Parameterized templates | In preparation |

## What happens after your transformation runs

A transformation is rarely the whole job. Because its result is an
ordinary model in the workspace, it can be fed straight into the next
transformation: an EER schema becomes a relational schema, and that
relational schema becomes SQL text. The CLI runs such a chain in one
command, passing intermediate models in memory, and a chain that proves
useful can be saved as a named pipeline and replayed.

Composing runs is the user's side of the story, and the User Guide
covers it in
[Pipelines](../../../user-guide/guides/pipelines.md), with a worked
end-to-end walkthrough in the
[User Guide tutorial](../../../user-guide/tutorial.md).

What matters on the authoring side is that chaining is only possible
because of what you declare. The CLI type-checks a chain from the
manifests before it executes anything: step N's target metamodel must
equal step N+1's source metamodel. The `source` and `target` entries in
`synth.json` are therefore not documentation, they are the interface
that decides whether your transformation can be composed with anyone
else's. Declaring them accurately is what makes your package a good
citizen in a chain.

## Prerequisites for all parts

You need a checkout of the Synthesis repository built once with `rush
install` and `rush build`, and the `synth` CLI. Until the
`@synthesis/*` packages are published to npm, transformation packages
resolve them from the repository workspace. Inside the repository you
can run the CLI as `node apps/cli/bin/run.js`; the tutorial writes
`synth` for short.

Part 1 assumes no prior Synthesis experience beyond the
[User Guide's concepts page](../../../user-guide/concepts.md). Each
later part builds directly on the one before it.
