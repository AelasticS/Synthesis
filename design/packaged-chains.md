# Packaged chains

A chain of transformations cannot be published or installed today. It can
only be composed inside a workspace, by whoever owns that workspace. This
note records why that is, what a chain package would look like, and the
one problem that has to be solved before it can exist.

Raised 2026-08-29 while writing the transformation tutorials, where the
two halves join up: the model-to-model tutorial produces a relational
schema and the model-to-text tutorial consumes it. That composition is
exactly the thing a reader would want to install as one unit, and cannot.

## What exists today

**A transformation package is one transformation.** Its `synth.json`
declares a single `kind` (`m2m` or `m2t`), one `entry` module and
`exportName`, one source metamodel, one target metamodel, and optionally
the `parts` it ships. There is no way to express "this package is two
transformations run in order".

**Chains are ad hoc, and live only in the command that runs them.**

```bash
synth transformation run eer-tutorial-basic sql-tutorial-basic \
  --in demo/library --out-dir ./generated
```

The CLI type-checks the chain from the manifests before executing
anything, requiring step N's target metamodel to equal step N+1's source
metamodel. Intermediate models are passed in memory and are not persisted
unless `--keep-intermediates` is given, and only the last step may be
`m2t`, because text cannot be consumed further.

**A pipeline names such a chain, but only inside one workspace.** A
pipeline is stored as plain JSON at `pipelines/<name>.json`, and its
`steps` field is an array of transformation *names* that must already be
installed in that workspace. It deliberately stores no data bindings: no
input model, no output target, no configuration, no consent flags,
because stored bindings would silently steer replays and a stored
configuration is provably wrong for any other input.

## Why that is not enough

A pipeline is a workspace artifact, not a package. Nothing about it can
be handed to anyone else:

- Its steps are local names, so it is meaningless in a workspace where
  those transformations are absent or installed under other names.
- It has no version, no dependencies, and no identity beyond a file name.
- It cannot be published, so a composition that took judgement to get
  right cannot be shared. Every consumer rebuilds it, and the type check
  that proves the steps fit runs once per workspace rather than once at
  publication.

The consequence is that Synthesis can distribute transformations but not
compositions of them, even though a composition is often the useful unit.
"EER to SQL" is a more meaningful thing to install than either of its
halves.

## Sketch of a chain package

The shape that fits the existing design:

```json
{
  "kind": "chain",
  "steps": [
    { "package": "@example/eer-to-relational", "version": "^1.0.0" },
    { "package": "@example/rel-to-sql-ddl", "version": "^1.0.0" }
  ]
}
```

- **Install resolves a closure.** `transformation install` on such a
  package installs the step packages too, then registers the chain under
  its own name. The steps remain ordinary transformations, individually
  installable and runnable.
- **The chain's interface is derived, not declared.** Its source
  metamodel is step 1's source, its target is the last step's target, and
  its kind is the last step's kind. Declaring them separately would allow
  a manifest to contradict its own steps.
- **The type check moves earlier.** The metamodel compatibility that the
  CLI verifies before each run can be verified once, when the chain is
  built or installed, because the steps are pinned.
- **Running it is unremarkable.** `synth transformation run <chain>
  --in ... --out-dir ...` behaves exactly as a single transformation
  does. A consumer should not need to know the package is a composition.

## The problem to solve first: configuration

This is the reason the note exists rather than an implementation ticket.

A configuration model is bound to a specific source model: its
`references.sourceModel` must equal the model being transformed. In a
chain, every model after the first is produced during the run and does
not exist when the command is issued. The CLI therefore allows `--config`
to bind to step 1 only, and refuses an explicit configuration for any
later step, with a message that says exactly this: a chain cannot take an
explicit configuration for a model that is produced mid-run. Later steps
must either be non-configuration-based or accept generated defaults via
`--default-configs`.

A packaged chain makes this sharper, because the interesting chains are
precisely the ones whose steps have design spaces. Four directions, none
free:

1. **Defaults only.** A chain runs its configuration-based steps on
   generated defaults, and the consent policy still applies: the user
   must pass `--default-configs`, and every decision is announced. Honest
   and cheap, but it makes a chain the one place where decisions cannot
   be chosen, which is a strange limitation for the unit meant to capture
   expertise.
2. **Configuration per step, addressed by step.** Allow a configuration
   model to reference a step of a chain rather than a materialized source
   model. This is the direct fix, and it requires relaxing the identity
   rule that currently makes configurations verifiable. The check that a
   configuration matches its input would need a different anchor.
3. **Configurations frozen into the package.** The chain ships
   configurations for its steps, making it a curated composition with
   opinions baked in. This is attractive for a published "best practice"
   chain, but it collides with the consent policy unless the chain
   announces every decision it carries, and it needs a rule for what
   happens when a consumer disagrees with one.
4. **Stepwise materialization.** Persist intermediates, let the user run
   `config init` against them, then replay. This is what the CLI advises
   today, and it works, but it is manual and it defeats the purpose of
   packaging the chain.

Option 1 is a defensible first version, provided it is a stated
limitation rather than an accident. Option 2 is the destination, and its
prerequisite is a way to validate a configuration against a step rather
than against a stored model.

## Open questions

- Do steps reference published packages, or names of already-installed
  transformations? Packages make a chain self-contained; names make it
  cheap but keep it workspace-bound.
- May a chain step be another chain? Nesting is natural and makes the
  resolution and the type check recursive.
- Does a chain get a decision model of its own, for issues that belong to
  the composition rather than to any step?
- What happens when a step package is already installed at a different
  version, and how are name collisions on install resolved?
- Should saved workspace pipelines converge on this format, or remain the
  lightweight local thing they are today?

## Recommendation

Decide the configuration question before building anything, because it
determines the manifest. If a first version ships, ship option 1 with the
limitation documented, and treat option 2 as the design target rather
than a later patch.

This matters for the publishing story: a transformation template and an
examples catalog teach people to build transformations, and the first
thing they will want to share afterwards is a composition of them.
