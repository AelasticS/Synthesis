---
sidebar_position: 2
---

# Configurations

Many transformations leave design decisions open instead of hard-coding
them: which naming convention the generated schema uses, whether emitted
identifiers are quoted, how inheritance is mapped. This page is the user
guide for making those decisions with `synth`.

## Three models behind a decision

A decision-based transformation ships two extra models inside its package
(they are **parts** of the package, not workspace models):

- The **decision model** declares the open issues and their options, with
  one option per issue marked as the default — e.g. issue
  `NamingConvention` with options `SnakeCase` (default) and `CamelCase`.
- The **binding model** attaches those issues to the source metamodel:
  globally (one decision for the whole run) or per element type (one
  decision per matching source element).

What you author is the third one: a **configuration model** — a workspace
model (kind `configuration-model`) recording one concrete choice per
decision, for one specific source model. `synth transformation show <tx>`
lists a transformation's issues, options, and defaults without running
anything.

## Why consent is explicit

`synth` never applies defaults silently. A default is still a design
decision, and a decision applied implicitly is a decision nobody reviewed —
the run's output would depend on choices the user never saw. So a
decision-based run must say what to do, in one of exactly two ways:

- `--config <ref>` — run on a configuration model you created and reviewed;
- `--default-configs` — explicitly accept generated defaults for this run;
  every applied choice is announced so nothing is invisible.

With neither, the run aborts (exit 2) before any engine work:

```text
Transformation 'eer-to-relational' is decision-based. Provide --config <ref>
(create one with: synth config init eer-to-relational --for com.example/persons)
or accept generated defaults explicitly with --default-configs.
```

In a terminal session the same policy appears as a prompt — use an existing
configuration, generate defaults for this run, or abort. Choosing in the
picker **is** the explicit consent; scripts and CI always need the flag.

## The workflow

### 1. Generate the default configuration

```bash
synth config init eer-to-relational --for com.example/persons
```

This runs the transformation's default-configuration generation — one
default choice per issue the binding model attaches, global and per-element
— against the named model, and saves the result as an editable workspace
model, by default at `<namespace>/<name>-cfg` (here
`com.example/persons-cfg`; override with `--out`, replace with
`--overwrite`). It is exactly the generation that `--default-configs`
accepts in memory, saved instead of used.

```bash
synth config ls
synth config show com.example/persons-cfg
```

`config show` renders the configuration with its transformation's context
and prints every recorded decision.

### 2. Edit the choices

```bash
synth config edit com.example/persons-cfg     # opens $EDITOR
```

A configuration model is a `.tsx` model like any other: each decision is a
choice element referencing an issue and the selected option by name —
switching `SnakeCase` to `CamelCase` in the `selectedOption` reference is
the whole edit. After editing, check that the file still renders against the
transformation's context:

```bash
synth model validate com.example/persons-cfg --tx eer-to-relational
```

### 3. Run with the configuration

```bash
synth transformation run eer-to-relational --in com.example/persons \
  --config com.example/persons-cfg --out com.example/persons-rel
```

Before executing, the configuration passes **two levels of validation**:

- **Nominal**: the header's stamped transformation and version, binding
  model, and source model must match the run — a configuration's
  `references.sourceModel` must equal the model named with `--in`, so a
  configuration made for one model can never silently steer another.
- **Structural**: the binding model identity is checked; every choice's
  issue must exist in the decision model; every selected option must belong
  to its issue; per-element choices must resolve their target elements in
  the input model.

### Partial configurations

A configuration does not have to cover every issue. Uncovered issues fall
back to their declared defaults — but never silently: each fallback is
announced in the run output as `(default)` and materialized as a real
choice, so the executed configuration is always complete and inspectable.
The `--default-configs` consent flag governs only the *wholly implicit*
case, where no configuration is given at all.

## Keeping generated defaults: `--save-config`

When you run on generated defaults and want to keep them as a starting
point for editing:

```bash
synth transformation run eer-to-relational --in com.example/persons \
  --default-configs --save-config com.example/persons-cfg \
  --out com.example/persons-rel
```

`--save-config` persists exactly the configuration the run used. It is only
valid together with `--default-configs` (running on `--config` means the
configuration already exists), only for single-step runs, and it refuses to
overwrite the input model.

## Configuring a chain, stepwise

In a chain, `--config` binds to **step 1 only**: a later step's input model
is only produced mid-run, so no reviewed configuration can exist for it in
advance. Every other decision-based step needs `--default-configs`. To
configure a later step explicitly, run stepwise — keep the intermediate,
configure against it, then run the next step:

```bash
# Run the chain once, keeping the intermediate model in the workspace
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --default-configs --keep-intermediates \
  --out-dir ./generated

# Configure step 2 against the kept intermediate ...
synth config init rel-to-sql-ddl --for com.example/persons-eer-to-relational
synth config edit com.example/persons-eer-to-relational-cfg

# ... and run step 2 with the reviewed configuration
synth transformation run rel-to-sql-ddl \
  --in com.example/persons-eer-to-relational \
  --config com.example/persons-eer-to-relational-cfg \
  --out-dir ./generated-reviewed
```

The same rules apply unchanged when the chain is a saved pipeline — see
[Pipelines](./pipelines.md).
