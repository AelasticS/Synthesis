---
sidebar_position: 4
---

# Tutorial

This tutorial walks through one complete working session with `synth`: from
an empty workspace to generated SQL files, a reviewed design decision, and a
saved pipeline you can replay on other models. The [Quick Start](./getting-started/quick-start.md)
compresses the same journey into a dozen commands; here every step is
explained.

Prerequisites: `synth` is [installed](./getting-started/installation.md). As in
the Quick Start, `synth transformation install` takes a local directory
containing a built transformation package. The two used here,
`eer-to-relational` (model-to-model) and `rel-to-sql-ddl`
(model-to-text), ship with `synth` in the `examples` folder of the
installation. The commands below refer to that folder as `$EX`:

```bash
EX=/usr/local/synth/examples      # Linux and macOS
```

```powershell
$EX = 'C:\synth\examples'         # Windows PowerShell
```

The other commands are the same in both shells. In PowerShell, write a
command on one line, or end its lines with a backtick instead of `\`.

## 1. Create the workspace

Everything `synth` manages lives in one local folder, the workspace:

```bash
synth init
synth doctor
```

`init` creates `~/.synth/` with `config.json`, `models/`,
`transformations/`, and `pipelines/`. `doctor` confirms the workspace is
healthy. It is worth knowing from day one, because it re-checks every
invariant this tutorial relies on and repairs model headers with
`doctor --fix`.

## 2. Install transformations and see what they declare

```bash
synth transformation install $EX/eer-to-relational
synth transformation install $EX/rel-to-sql-ddl
synth transformation ls
```

Install comes before the model import: a model file imports its
metamodel package (here `eer-metamodel`), and that package comes with the
installed transformation.

Before running anything, ask what a transformation is:

```bash
synth transformation show eer-to-relational
```

The output names its kind (model-to-model), its source and target
metamodels (EER → Relational), and `variability: yes` with the decision
model that makes it **configuration-based**: its open design issues, such
as `NamingConvention` with options `SnakeCase` (default) and `CamelCase`,
are closed per run. Nothing has executed yet; all of this comes from the
package's manifest.

## 3. Import a model

Models are organized in **namespaces**, nested directories under
`models/`. Create one, then import a model file into it:

```bash
synth namespace mk com.example
synth model import ./persons.tsx --as com.example/persons
```

`persons.tsx` is a `.tsx` module, JSX that renders into an EER model. Save
the file shown in [Managing Models](./guides/managing-models.md#models-are-code)
as `persons.tsx` in your current folder. (Any model in
`$EX/eer-to-relational/sample/` works the same way.)
The import is a **validation gate**, not a copy: the file is rendered for
real against its metamodel, and broken JSX or a dangling reference rejects
it. From now on the model is addressed by its **ref**, `com.example/persons`.

```bash
synth model ls
synth model show com.example/persons
```

`model show` prints the `$synth` header the import wrote: kind, metamodel,
author (defaulted from your `git config`), version, dates.

## 4. First run and the consent policy

Try the obvious command:

```bash
synth transformation run eer-to-relational --in com.example/persons
```

In a script this fails (exit 2) before any engine work:

```text
Transformation 'eer-to-relational' is configuration-based. Provide --config <ref>
(create one with: synth config init eer-to-relational --for com.example/persons)
or accept generated defaults explicitly with --default-configs.
```

This is deliberate: `synth` **never applies design decisions silently**, and
a default is still a decision. (In a terminal, the same policy appears as a
prompt; choosing in the picker is the explicit consent.) Accept the
defaults explicitly:

```bash
synth transformation run eer-to-relational --in com.example/persons \
  --default-configs --out com.example/persons-rel
```

Every applied default is announced in the output, e.g.
`NamingConvention -> SnakeCase (default)`, so nothing is invisible. The
result is a new workspace model:

```bash
synth model show com.example/persons-rel
```

Its header carries provenance: `generatedBy` records the transformation,
its version, the configuration used, and the date.

`model show` prints only the header. To see the generated model itself,
export it to a file and open it:

```bash
synth model export com.example/persons-rel --to ./persons-rel.tsx
```

## 5. Take control of a decision

To choose `CamelCase` instead of the default, create a **configuration
model**, an editable workspace model recording one choice per decision:

```bash
synth config init eer-to-relational --for com.example/persons
synth config show com.example/persons-cfg
```

`config init` saves the generated defaults as `com.example/persons-cfg`.
Edit it and flip the choice:

```bash
synth config edit com.example/persons-cfg     # opens $EDITOR
```

Each decision is a choice element referencing an issue and the selected
option by name; switching `SnakeCase` to `CamelCase` in the
`selectedOption` reference is the whole edit. Check the file still renders
against the transformation's context, then run with it:

```bash
synth model validate com.example/persons-cfg --tx eer-to-relational

synth transformation run eer-to-relational --in com.example/persons \
  --config com.example/persons-cfg --out com.example/persons-rel --overwrite
```

`--overwrite` is needed because the target model already exists from step 4;
existing results are never replaced implicitly. Before executing, the
configuration is validated both nominally (it was made for *this*
transformation and *this* source model) and structurally (every choice
names a real issue and a legal option).

## 6. Chain to SQL

The second transformation is model-to-text: it turns a Relational model
into SQL DDL files. Run both steps as one **chain**, where the intermediate
model is handed from step to step in memory:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --config com.example/persons-cfg \
  --default-configs --out-dir ./generated
```

Before anything executes, the chain is type-checked from the manifests:
step 1's target metamodel must equal step 2's source metamodel. `--config`
binds to **step 1 only** (step 2's input model only exists mid-run, so no
reviewed configuration can exist for it in advance); `--default-configs`
consents to the defaults of step 2. Because the last step is
model-to-text, the destination is `--out-dir`, and the generated `.sql`
files land in `./generated`.

To configure a *later* step explicitly, run stepwise with
`--keep-intermediates`; the full sequence is in
[Configurations](./guides/configurations.md#configuring-a-chain-stepwise).

## 7. Save the process as a pipeline

The chain works; give it a name so it can be replayed without retyping:

```bash
synth pipeline mk gen-sql eer-to-relational rel-to-sql-ddl \
  --description "EER to SQL DDL"
synth pipeline ls
```

A pipeline stores **steps only**, with no input model, no configuration, and no
consents, so every run names its own data, with the same consent policy as
always:

```bash
synth pipeline run gen-sql --in com.example/persons \
  --default-configs --out-dir ./generated
```

Point it at any other EER model in your workspace and it does the same job
there. (After a successful ad-hoc chain you can also capture it directly
with `--save-as gen-sql` instead of `pipeline mk`.)

## 8. The workspace protects itself

Two guards you will meet sooner or later:

- Deleting a model that others depend on is refused:
  `synth model rm com.example/persons` fails while `persons-rel` and
  `persons-cfg` reference it, listing them. `--cascade` deletes the whole
  dependent subtree, explicitly.
- Uninstalling a transformation that a saved pipeline uses is refused until
  you update or remove the pipeline.

And whenever something feels off, `synth doctor` re-checks every model and
pipeline in the workspace and names what is wrong.

## Where to go next

- [Concepts](./concepts.md): the ideas behind everything you just did.
- [Managing Models](./guides/managing-models.md),
  [Configurations](./guides/configurations.md),
  [Pipelines](./guides/pipelines.md): the task guides in depth.
- [Command Reference](./reference/commands.md): every command, flag, and exit
  code.
- Want to *build* a transformation like `eer-to-relational` yourself? Start
  with the [Developer Guide](../developer-guide/index.md).
