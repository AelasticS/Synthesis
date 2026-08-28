---
sidebar_position: 5
---

# Pipelines

A pipeline is a **named process**: an ordered list of transformation steps
you can replay by name. It is stored as plain JSON — not a model — at
`pipelines/<name>.json` in the workspace:

```json
{
  "name": "gen-sql",
  "steps": ["eer-to-relational", "rel-to-sql-ddl"],
  "description": "EER to SQL DDL",
  "createdAt": "2026-08-28T09:00:00.000Z",
  "modifiedAt": "2026-08-28T09:00:00.000Z"
}
```

## Steps only — why a pipeline stores no data

A pipeline deliberately stores **no data bindings**: no input model, no
output target, no configuration, no consent flags. Stored bindings would
silently steer replays — the same hazard the
[explicit-consent policy](./configurations#why-consent-is-explicit) exists
to prevent — and a stored configuration is provably wrong for any other
input, because a configuration model is bound to one specific source model.
So every `pipeline run` names its own data and gives its own consents,
exactly like typing the chain out: `--in` is always required, and a missing
`--in` is a clear error, never a fallback.

## Creating a pipeline

```bash
synth pipeline mk gen-sql eer-to-relational rel-to-sql-ddl \
  --description "EER to SQL DDL"
```

Validation is **static** — nothing executes:

- the name must be a valid segment (letters, digits, hyphen, underscore)
  and must not shadow an installed transformation (one name meaning two
  runnable things invites invoking the wrong one);
- there must be at least one step and every step must be installed;
- the chain must type-check from the manifests — step N's target metamodel
  equals step N+1's source metamodel, and a mismatch names the incompatible
  pair (exit 2);
- only the last step may be model-to-text.

These are the same checks the execution pre-flight runs, so authoring-time
and run-time judgments cannot drift. An existing pipeline is only replaced
with `--overwrite` (`createdAt` survives).

Alternatively, capture a chain you just ran successfully:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --default-configs --out-dir ./generated \
  --save-as gen-sql
```

`--save-as` persists the steps — the process only — after a successful run,
under the same name checks as `pipeline mk`.

## Running a pipeline

```bash
synth pipeline run gen-sql --in com.example/persons \
  --default-configs --out-dir ./generated
```

`pipeline run` substitutes the saved steps and goes through the **identical
request path** as `transformation run` with those steps: full pre-flight,
`--out`/`--out-dir` by the last step's kind, `--keep-intermediates`, and
the normal consent policy — `--config` binds to step 1 only, every other
decision-based step requires `--default-configs`, and an unconsented run
aborts before any engine work. A pipeline is convenience, never a bypass.

```bash
# Reviewed configuration for step 1, defaults for the rest
synth pipeline run gen-sql --in com.example/persons \
  --config com.example/persons-cfg --default-configs --out-dir ./generated
```

An unknown pipeline name exits 3; a pipeline file that no longer passes the
schema exits 2 listing every problem, with `pipeline edit` as the repair
path.

## Managing pipelines

```bash
synth pipeline ls               # names, steps, descriptions
synth pipeline show gen-sql     # every field
synth pipeline edit gen-sql     # open the JSON in $EDITOR
synth pipeline rm gen-sql       # delete
```

After `pipeline edit` closes the editor, the file is re-validated with the
same static checks as `pipeline mk`; problems are reported as warnings
(`pipeline run` would refuse until they are fixed). `pipeline rm` needs no
dependency check — nothing references a pipeline, and the transformations
it named stay installed.

## Guards and health

- `synth transformation uninstall` is **refused** (exit 2) while any saved
  pipeline lists the transformation as a step, naming the pipelines; update
  them or `pipeline rm` first — there is no cascade. Even a pipeline file
  that fails schema validation still protects the steps its JSON names,
  because repairing it with `pipeline edit` must stay possible.
- `synth doctor` applies the `pipeline mk` static checks to every pipeline
  file and reports problems as warnings naming the pipeline; a broken
  pipeline never blocks the workspace.
