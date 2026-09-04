# synth CLI Commands

This document is auto-generated from the oclif command definitions.

* [`synth autocomplete [SHELL]`](#synth-autocomplete-shell)
* [`synth cd [NAMESPACE]`](#synth-cd-namespace)
* [`synth config edit REF`](#synth-config-edit-ref)
* [`synth config init TX`](#synth-config-init-tx)
* [`synth config ls`](#synth-config-ls)
* [`synth config rm REF`](#synth-config-rm-ref)
* [`synth config show REF`](#synth-config-show-ref)
* [`synth doctor`](#synth-doctor)
* [`synth help [COMMAND]`](#synth-help-command)
* [`synth init`](#synth-init)
* [`synth model export REF`](#synth-model-export-ref)
* [`synth model import FILE`](#synth-model-import-file)
* [`synth model ls`](#synth-model-ls)
* [`synth model rm REF`](#synth-model-rm-ref)
* [`synth model show REF`](#synth-model-show-ref)
* [`synth model validate REF`](#synth-model-validate-ref)
* [`synth namespace ls`](#synth-namespace-ls)
* [`synth namespace mk NAMESPACE`](#synth-namespace-mk-namespace)
* [`synth namespace rm NAMESPACE`](#synth-namespace-rm-namespace)
* [`synth ns ls`](#synth-ns-ls)
* [`synth ns mk NAMESPACE`](#synth-ns-mk-namespace)
* [`synth ns rm NAMESPACE`](#synth-ns-rm-namespace)
* [`synth pipeline edit NAME`](#synth-pipeline-edit-name)
* [`synth pipeline ls`](#synth-pipeline-ls)
* [`synth pipeline mk NAME [TX]`](#synth-pipeline-mk-name-tx)
* [`synth pipeline rm NAME`](#synth-pipeline-rm-name)
* [`synth pipeline run NAME`](#synth-pipeline-run-name)
* [`synth pipeline show NAME`](#synth-pipeline-show-name)
* [`synth pl edit NAME`](#synth-pl-edit-name)
* [`synth pl ls`](#synth-pl-ls)
* [`synth pl mk NAME [TX]`](#synth-pl-mk-name-tx)
* [`synth pl rm NAME`](#synth-pl-rm-name)
* [`synth pl run NAME`](#synth-pl-run-name)
* [`synth pl show NAME`](#synth-pl-show-name)
* [`synth plugins`](#synth-plugins)
* [`synth plugins add PLUGIN`](#synth-plugins-add-plugin)
* [`synth plugins:inspect PLUGIN...`](#synth-pluginsinspect-plugin)
* [`synth plugins install PLUGIN`](#synth-plugins-install-plugin)
* [`synth plugins link PATH`](#synth-plugins-link-path)
* [`synth plugins remove [PLUGIN]`](#synth-plugins-remove-plugin)
* [`synth plugins reset`](#synth-plugins-reset)
* [`synth plugins uninstall [PLUGIN]`](#synth-plugins-uninstall-plugin)
* [`synth plugins unlink [PLUGIN]`](#synth-plugins-unlink-plugin)
* [`synth plugins update`](#synth-plugins-update)
* [`synth transformation build`](#synth-transformation-build)
* [`synth transformation init NAME`](#synth-transformation-init-name)
* [`synth transformation install PACKAGE`](#synth-transformation-install-package)
* [`synth transformation ls`](#synth-transformation-ls)
* [`synth transformation pack`](#synth-transformation-pack)
* [`synth transformation publish`](#synth-transformation-publish)
* [`synth transformation run TX`](#synth-transformation-run-tx)
* [`synth transformation show NAME`](#synth-transformation-show-name)
* [`synth transformation test`](#synth-transformation-test)
* [`synth transformation uninstall NAME`](#synth-transformation-uninstall-name)
* [`synth tx build`](#synth-tx-build)
* [`synth tx init NAME`](#synth-tx-init-name)
* [`synth tx install PACKAGE`](#synth-tx-install-package)
* [`synth tx ls`](#synth-tx-ls)
* [`synth tx pack`](#synth-tx-pack)
* [`synth tx publish`](#synth-tx-publish)
* [`synth tx run TX`](#synth-tx-run-tx)
* [`synth tx show NAME`](#synth-tx-show-name)
* [`synth tx test`](#synth-tx-test)
* [`synth tx uninstall NAME`](#synth-tx-uninstall-name)
* [`synth workspace`](#synth-workspace)

## `synth autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ synth autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ synth autocomplete

  $ synth autocomplete bash

  $ synth autocomplete zsh

  $ synth autocomplete powershell

  $ synth autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.49/src/commands/autocomplete/index.ts)_

## `synth cd [NAMESPACE]`

Change or display the current namespace.

```
USAGE
  $ synth cd [NAMESPACE] [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  [NAMESPACE]  Namespace to switch to. If omitted, shows current namespace.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Change or display the current namespace.

EXAMPLES
  $ synth cd

  $ synth cd com.example.orders
```

## `synth config edit REF`

Open a configuration model in $EDITOR.

```
USAGE
  $ synth config edit REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Configuration model ref to edit.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Open a configuration model in $EDITOR.

  After editing, 'synth model validate <ref> --tx <name>' checks that the file still renders against its
  transformation's context.

EXAMPLES
  $ synth config edit com.example/persons-cfg
```

## `synth config init TX`

Generate the default configuration model for a transformation on a model.

```
USAGE
  $ synth config init TX --for <value> [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--out <value>]
    [--overwrite]

ARGUMENTS
  TX  Installed transformation to create a configuration for.

FLAGS
  --for=<value>  (required) Model ref this configuration applies to.
  --out=<value>  Ref to store the configuration model as (default: '<namespace>/<name>-cfg' derived from --for).
  --overwrite    Replace the configuration model if it already exists.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Generate the default configuration model for a transformation on a model.

  Runs the transformation's default-configuration generation (one default choice per issue its binding model attaches,
  global and per-element) against the model named with --for and saves the result as an editable configuration model in
  the workspace; this is the same generation 'transformation run --default-configs' accepts in memory. Edit the saved
  file to steer the transformation, then pass it to 'transformation run --config'. In a terminal session, a missing
  transformation opens a picker over the installed configuration-based transformations and a missing --for over the
  models matching its source metamodel; piped, scripted, --json, --quiet, and CI invocations never prompt. Exit codes: 2
  for a source-metamodel mismatch or a result that fails the import gate, 3 for an unknown transformation or missing
  model.

EXAMPLES
  $ synth config init eer-to-relational --for com.example/persons

  $ synth config init eer-to-relational --for com.example/persons --out com.example/persons-config
```

## `synth config ls`

List configuration models in the workspace (models whose header declares kind configuration-model), optionally filtered by transformation.

```
USAGE
  $ synth config ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--for <value>]

FLAGS
  --for=<value>  Only configurations generated by this transformation.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List configuration models in the workspace (models whose header declares kind configuration-model), optionally
  filtered by transformation.

EXAMPLES
  $ synth config ls

  $ synth config ls --for eer-to-relational
```

## `synth config rm REF`

Delete a configuration model from the workspace.

```
USAGE
  $ synth config rm REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--cascade]

ARGUMENTS
  REF  Configuration model ref to delete.

FLAGS
  --cascade  Also delete every model that transitively references this one.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a configuration model from the workspace.

  Configuration models live in the models tree, so removal has 'model rm' semantics (dependency check, --cascade); this
  command additionally refuses refs that are not configuration models.

EXAMPLES
  $ synth config rm com.example/persons-cfg
```

## `synth config show REF`

Render a configuration model and print every decision it records.

```
USAGE
  $ synth config show REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--tx <value>]

ARGUMENTS
  REF  Configuration model ref to show.

FLAGS
  --tx=<value>  Installed transformation providing the render context (default: the header's generatedBy.tx).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Render a configuration model and print every decision it records.

  The model renders with its transformation's context (decision/binding models); the transformation is taken from the
  header's generatedBy, or from --tx for hand-written configurations.

EXAMPLES
  $ synth config show com.example/persons-cfg

  $ synth config show com.example/persons-cfg --tx eer-to-relational
```

## `synth doctor`

Check workspace integrity: missing files, broken references.

```
USAGE
  $ synth doctor [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--fix]

FLAGS
  --fix  Re-derive and write missing or unparseable model headers.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Check workspace integrity: missing files, broken references.

EXAMPLES
  $ synth doctor

  $ synth doctor --fix
```

## `synth help [COMMAND]`

Display help for synth.

```
USAGE
  $ synth help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for synth.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.48/src/commands/help.ts)_

## `synth init`

Create a new Synthesis workspace.

```
USAGE
  $ synth init [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--path <value>]

FLAGS
  --path=<value>  [default: ~/.synth] Directory to create the workspace in.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Create a new Synthesis workspace.

EXAMPLES
  $ synth init

  $ synth init --path ~/my-workspace
```

## `synth model export REF`

Write a model from the workspace to a file on disk.

```
USAGE
  $ synth model export REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--to <value>]

ARGUMENTS
  REF  Model ref to export.

FLAGS
  --to=<value>  Destination file path.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Write a model from the workspace to a file on disk.

EXAMPLES
  $ synth model export com.example/persons

  $ synth model export com.example/persons --to ./out/persons.tsx
```

## `synth model import FILE`

Validate a .tsx model file and copy it into the workspace.

```
USAGE
  $ synth model import FILE [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--as <value>] [--tx <value>]
    [--author <value>] [--description <value>] [--tags <value>] [--force]

ARGUMENTS
  FILE  Path to the .tsx model file to import.

FLAGS
  --as=<value>           Ref to assign to the imported model (namespace/name).
  --author=<value>       Author for the $synth header (default: existing header, then git config).
  --description=<value>  One-line description for the $synth header.
  --force                Overwrite the target model if it already exists.
  --tags=<value>         Comma-separated tags for the $synth header.
  --tx=<value>           Installed transformation whose parts provide the render context (required for configuration
                         models).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Validate a .tsx model file and copy it into the workspace.

  Configuration models reference their transformation's decision/binding models and the source model they configure;
  pass --tx <name> so the validation render pre-loads the installed transformation's parts (and the file's header
  references); without it such a file cannot render.

EXAMPLES
  $ synth model import ./persons.tsx

  $ synth model import ./persons.tsx --as com.example/persons

  $ synth model import ./persons-cfg.tsx --as com.example/persons-cfg --tx eer-to-relational

  $ synth model import ./persons.tsx --tags eer,demo --force
```

## `synth model ls`

List models in the workspace or a namespace.

```
USAGE
  $ synth model ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List models in the workspace or a namespace.

EXAMPLES
  $ synth model ls

  $ synth model ls --ns com.example.orders
```

## `synth model rm REF`

Delete a model from the workspace.

```
USAGE
  $ synth model rm REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--cascade]

ARGUMENTS
  REF  Model ref to delete.

FLAGS
  --cascade  Also delete every model that transitively references this one.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a model from the workspace.

EXAMPLES
  $ synth model rm com.example/persons

  $ synth model rm com.example/persons --cascade
```

## `synth model show REF`

Show a model header and file location.

```
USAGE
  $ synth model show REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Model ref (namespace/name).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Show a model header and file location.

EXAMPLES
  $ synth model show com.example/persons
```

## `synth model validate REF`

Check the model against its metamodel.

```
USAGE
  $ synth model validate REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--against <value>] [--tx
    <value>]

ARGUMENTS
  REF  Model ref to validate.

FLAGS
  --against=<value>  Metamodel the header must declare (defaults to the derived import).
  --tx=<value>       Installed transformation whose parts provide the render context (required for configuration
                     models).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Check the model against its metamodel.

  Configuration models reference their transformation's decision/binding models; pass --tx <name> so the validation
  render pre-loads the installed transformation's parts (and the model's header references).

EXAMPLES
  $ synth model validate com.example/persons

  $ synth model validate com.example/persons --against eer-metamodel

  $ synth model validate com.example/persons-cfg --tx eer-to-relational
```

## `synth namespace ls`

List all namespaces in the workspace.

```
USAGE
  $ synth namespace ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List all namespaces in the workspace.

ALIASES
  $ synth ns ls

EXAMPLES
  $ synth namespace ls
```

## `synth namespace mk NAMESPACE`

Create an empty namespace.

```
USAGE
  $ synth namespace mk NAMESPACE [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAMESPACE  Name of the namespace to create.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Create an empty namespace.

ALIASES
  $ synth ns mk

EXAMPLES
  $ synth namespace mk com.example.orders
```

## `synth namespace rm NAMESPACE`

Remove a namespace (must be empty unless --force).

```
USAGE
  $ synth namespace rm NAMESPACE [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--force] [--cascade]

ARGUMENTS
  NAMESPACE  Name of the namespace to remove.

FLAGS
  --cascade  Also delete every model outside the namespace that transitively references a model inside it (implies
             --force).
  --force    Remove even if the namespace contains files.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Remove a namespace (must be empty unless --force).

ALIASES
  $ synth ns rm

EXAMPLES
  $ synth namespace rm com.example.orders

  $ synth namespace rm com.example.orders --force
```

## `synth ns ls`

List all namespaces in the workspace.

```
USAGE
  $ synth ns ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List all namespaces in the workspace.

ALIASES
  $ synth ns ls

EXAMPLES
  $ synth ns ls
```

## `synth ns mk NAMESPACE`

Create an empty namespace.

```
USAGE
  $ synth ns mk NAMESPACE [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAMESPACE  Name of the namespace to create.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Create an empty namespace.

ALIASES
  $ synth ns mk

EXAMPLES
  $ synth ns mk com.example.orders
```

## `synth ns rm NAMESPACE`

Remove a namespace (must be empty unless --force).

```
USAGE
  $ synth ns rm NAMESPACE [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--force] [--cascade]

ARGUMENTS
  NAMESPACE  Name of the namespace to remove.

FLAGS
  --cascade  Also delete every model outside the namespace that transitively references a model inside it (implies
             --force).
  --force    Remove even if the namespace contains files.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Remove a namespace (must be empty unless --force).

ALIASES
  $ synth ns rm

EXAMPLES
  $ synth ns rm com.example.orders

  $ synth ns rm com.example.orders --force
```

## `synth pipeline edit NAME`

Open a saved pipeline in $EDITOR.

```
USAGE
  $ synth pipeline edit NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to edit.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Open a saved pipeline in $EDITOR.

  After the editor closes, the file is validated like 'pipeline mk' validates a new pipeline: schema (process-only
  fields), every step installed, chain type compatibility. Every problem is reported as a warning ('pipeline run <name>'
  would refuse until they are fixed).

ALIASES
  $ synth pl edit

EXAMPLES
  $ synth pipeline edit gen-sql
```

## `synth pipeline ls`

List saved pipelines (named transformation chains stored under pipelines/ in the workspace).

```
USAGE
  $ synth pipeline ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List saved pipelines (named transformation chains stored under pipelines/ in the workspace).

ALIASES
  $ synth pl ls

EXAMPLES
  $ synth pipeline ls

  $ synth pipeline ls --json
```

## `synth pipeline mk NAME [TX]`

Create a saved pipeline from an ordered list of installed transformations.

```
USAGE
  $ synth pipeline mk NAME... [TX...] [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--description
    <value>] [--overwrite]

ARGUMENTS
  NAME...  Name for the pipeline (letters, digits, hyphen, underscore).
  [TX...]  Installed transformations forming the steps, in execution order (at least one).

FLAGS
  --description=<value>  One-line description stored with the pipeline.
  --overwrite            Replace an existing pipeline of the same name (createdAt survives).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Create a saved pipeline from an ordered list of installed transformations.

  Validation is static (nothing is executed): the name must be a valid segment and must not shadow an installed
  transformation, every step must be installed, the chain must type-check from the manifests (step N's target metamodel
  equals step N+1's source metamodel), and only the last step may be m2t. A pipeline stores the process only (its
  steps): no input model, no configuration, no consent flags; every 'pipeline run' names its own data explicitly. An
  existing pipeline is only replaced with --overwrite (createdAt survives). Exit codes: 2 for a chain type mismatch, 3
  for a step that is not installed.

ALIASES
  $ synth pl mk

EXAMPLES
  $ synth pipeline mk gen-sql eer-to-relational rel-to-sql-ddl

  $ synth pipeline mk gen-sql eer-to-relational rel-to-sql-ddl --description "EER to SQL DDL" --overwrite
```

## `synth pipeline rm NAME`

Delete a saved pipeline.

```
USAGE
  $ synth pipeline rm NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to delete.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a saved pipeline.

  A pipeline is a saved process, not a model: nothing references it, so deletion needs no dependency check and no
  --cascade. The transformations it named stay installed.

ALIASES
  $ synth pl rm

EXAMPLES
  $ synth pipeline rm gen-sql
```

## `synth pipeline run NAME`

Run a saved pipeline on a workspace model.

```
USAGE
  $ synth pipeline run NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--in <value>] [--out <value>]
    [--out-dir <value>] [--default-configs] [--save-config <value> | --config <value>] [--keep-intermediates]
    [--overwrite]

ARGUMENTS
  NAME  Name of the saved pipeline to run.

FLAGS
  --config=<value>       Configuration model ref for step 1 (configuration-based only; later steps take
                         --default-configs).
  --default-configs      Explicitly accept generated default configurations for every configuration-based step not
                         covered by --config.
  --in=<value>           Source model ref the first step transforms (always required; a pipeline stores no data
                         bindings).
  --keep-intermediates   Also write every intermediate step result as a workspace model
                         ('<namespace>/<name>-<step-tx>').
  --out=<value>          Destination ref for the final result model (last step m2m only; default:
                         '<namespace>/<name>-<last-tx>' derived from --in).
  --out-dir=<value>      Output directory for generated files (last step m2t only).
  --overwrite            Replace existing targets (final and intermediate models, --save-config target).
  --save-config=<value>  Persist the generated default configuration as a workspace model at this ref (single-step
                         pipeline with --default-configs only).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run a saved pipeline on a workspace model.

  A pipeline stores only the process: its transformation steps. Every run names its own data explicitly, exactly like
  'transformation run' with the same steps: --in is always required, output goes to --out (last step m2m; default
  '<namespace>/<name>-<last-tx>' derived from --in) or --out-dir (last step m2t), and configuration consent follows the
  normal policy (--config binds to step 1 only; every other configuration-based step requires --default-configs,
  otherwise the run aborts before any engine work). The full pre-flight applies; a pipeline is convenience, never a
  bypass. In a terminal session, missing values are asked for interactively: no name opens a picker over the saved
  pipelines, a missing --in over the models matching step 1's source metamodel, an unconsented configuration-based step
  offers --config/--default-configs explicitly, and a missing --out-dir is prompted for. Piped, scripted, --json,
  --quiet, and CI invocations never prompt. Exit codes: 2 for a missing configuration consent, a chain or source
  metamodel mismatch, an invalid configuration or pipeline file, or a result that fails the import gate, 3 for an
  unknown pipeline, transformation, or model.

ALIASES
  $ synth pl run

EXAMPLES
  $ synth pipeline run gen-sql --in com.example/persons --default-configs --out-dir ./generated

  $ synth pipeline run to-relational --in com.example/persons --config com.example/persons-cfg
```

## `synth pipeline show NAME`

Show every field of a saved pipeline.

```
USAGE
  $ synth pipeline show NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to show.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Show every field of a saved pipeline.

ALIASES
  $ synth pl show

EXAMPLES
  $ synth pipeline show gen-sql

  $ synth pipeline show gen-sql --json
```

## `synth pl edit NAME`

Open a saved pipeline in $EDITOR.

```
USAGE
  $ synth pl edit NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to edit.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Open a saved pipeline in $EDITOR.

  After the editor closes, the file is validated like 'pipeline mk' validates a new pipeline: schema (process-only
  fields), every step installed, chain type compatibility. Every problem is reported as a warning ('pipeline run <name>'
  would refuse until they are fixed).

ALIASES
  $ synth pl edit

EXAMPLES
  $ synth pl edit gen-sql
```

## `synth pl ls`

List saved pipelines (named transformation chains stored under pipelines/ in the workspace).

```
USAGE
  $ synth pl ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List saved pipelines (named transformation chains stored under pipelines/ in the workspace).

ALIASES
  $ synth pl ls

EXAMPLES
  $ synth pl ls

  $ synth pl ls --json
```

## `synth pl mk NAME [TX]`

Create a saved pipeline from an ordered list of installed transformations.

```
USAGE
  $ synth pl mk NAME... [TX...] [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--description
    <value>] [--overwrite]

ARGUMENTS
  NAME...  Name for the pipeline (letters, digits, hyphen, underscore).
  [TX...]  Installed transformations forming the steps, in execution order (at least one).

FLAGS
  --description=<value>  One-line description stored with the pipeline.
  --overwrite            Replace an existing pipeline of the same name (createdAt survives).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Create a saved pipeline from an ordered list of installed transformations.

  Validation is static (nothing is executed): the name must be a valid segment and must not shadow an installed
  transformation, every step must be installed, the chain must type-check from the manifests (step N's target metamodel
  equals step N+1's source metamodel), and only the last step may be m2t. A pipeline stores the process only (its
  steps): no input model, no configuration, no consent flags; every 'pipeline run' names its own data explicitly. An
  existing pipeline is only replaced with --overwrite (createdAt survives). Exit codes: 2 for a chain type mismatch, 3
  for a step that is not installed.

ALIASES
  $ synth pl mk

EXAMPLES
  $ synth pl mk gen-sql eer-to-relational rel-to-sql-ddl

  $ synth pl mk gen-sql eer-to-relational rel-to-sql-ddl --description "EER to SQL DDL" --overwrite
```

## `synth pl rm NAME`

Delete a saved pipeline.

```
USAGE
  $ synth pl rm NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to delete.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a saved pipeline.

  A pipeline is a saved process, not a model: nothing references it, so deletion needs no dependency check and no
  --cascade. The transformations it named stay installed.

ALIASES
  $ synth pl rm

EXAMPLES
  $ synth pl rm gen-sql
```

## `synth pl run NAME`

Run a saved pipeline on a workspace model.

```
USAGE
  $ synth pl run NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--in <value>] [--out <value>]
    [--out-dir <value>] [--default-configs] [--save-config <value> | --config <value>] [--keep-intermediates]
    [--overwrite]

ARGUMENTS
  NAME  Name of the saved pipeline to run.

FLAGS
  --config=<value>       Configuration model ref for step 1 (configuration-based only; later steps take
                         --default-configs).
  --default-configs      Explicitly accept generated default configurations for every configuration-based step not
                         covered by --config.
  --in=<value>           Source model ref the first step transforms (always required; a pipeline stores no data
                         bindings).
  --keep-intermediates   Also write every intermediate step result as a workspace model
                         ('<namespace>/<name>-<step-tx>').
  --out=<value>          Destination ref for the final result model (last step m2m only; default:
                         '<namespace>/<name>-<last-tx>' derived from --in).
  --out-dir=<value>      Output directory for generated files (last step m2t only).
  --overwrite            Replace existing targets (final and intermediate models, --save-config target).
  --save-config=<value>  Persist the generated default configuration as a workspace model at this ref (single-step
                         pipeline with --default-configs only).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run a saved pipeline on a workspace model.

  A pipeline stores only the process: its transformation steps. Every run names its own data explicitly, exactly like
  'transformation run' with the same steps: --in is always required, output goes to --out (last step m2m; default
  '<namespace>/<name>-<last-tx>' derived from --in) or --out-dir (last step m2t), and configuration consent follows the
  normal policy (--config binds to step 1 only; every other configuration-based step requires --default-configs,
  otherwise the run aborts before any engine work). The full pre-flight applies; a pipeline is convenience, never a
  bypass. In a terminal session, missing values are asked for interactively: no name opens a picker over the saved
  pipelines, a missing --in over the models matching step 1's source metamodel, an unconsented configuration-based step
  offers --config/--default-configs explicitly, and a missing --out-dir is prompted for. Piped, scripted, --json,
  --quiet, and CI invocations never prompt. Exit codes: 2 for a missing configuration consent, a chain or source
  metamodel mismatch, an invalid configuration or pipeline file, or a result that fails the import gate, 3 for an
  unknown pipeline, transformation, or model.

ALIASES
  $ synth pl run

EXAMPLES
  $ synth pl run gen-sql --in com.example/persons --default-configs --out-dir ./generated

  $ synth pl run to-relational --in com.example/persons --config com.example/persons-cfg
```

## `synth pl show NAME`

Show every field of a saved pipeline.

```
USAGE
  $ synth pl show NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the saved pipeline to show.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Show every field of a saved pipeline.

ALIASES
  $ synth pl show

EXAMPLES
  $ synth pl show gen-sql

  $ synth pl show gen-sql --json
```

## `synth plugins`

List installed plugins.

```
USAGE
  $ synth plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ synth plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/index.ts)_

## `synth plugins add PLUGIN`

Installs a plugin into synth.

```
USAGE
  $ synth plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into synth.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SYNTH_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SYNTH_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ synth plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ synth plugins add myplugin

  Install a plugin from a github url.

    $ synth plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ synth plugins add someuser/someplugin
```

## `synth plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ synth plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ synth plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/inspect.ts)_

## `synth plugins install PLUGIN`

Installs a plugin into synth.

```
USAGE
  $ synth plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into synth.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SYNTH_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SYNTH_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ synth plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ synth plugins install myplugin

  Install a plugin from a github url.

    $ synth plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ synth plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/install.ts)_

## `synth plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ synth plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ synth plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/link.ts)_

## `synth plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ synth plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ synth plugins unlink
  $ synth plugins remove

EXAMPLES
  $ synth plugins remove myplugin
```

## `synth plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ synth plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/reset.ts)_

## `synth plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ synth plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ synth plugins unlink
  $ synth plugins remove

EXAMPLES
  $ synth plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/uninstall.ts)_

## `synth plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ synth plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ synth plugins unlink
  $ synth plugins remove

EXAMPLES
  $ synth plugins unlink myplugin
```

## `synth plugins update`

Update installed plugins.

```
USAGE
  $ synth plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.67/src/commands/plugins/update.ts)_

## `synth transformation build`

Build the transformation in the current directory.

```
USAGE
  $ synth transformation build [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Build the transformation in the current directory.

ALIASES
  $ synth tx build

EXAMPLES
  $ synth transformation build
```

## `synth transformation init NAME`

Scaffold a new transformation project.

```
USAGE
  $ synth transformation init NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name for the new transformation project.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Scaffold a new transformation project.

ALIASES
  $ synth tx init

EXAMPLES
  $ synth transformation init eer-to-relational
```

## `synth transformation install PACKAGE`

Install a transformation from npm, git, or local path.

```
USAGE
  $ synth transformation install PACKAGE [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  PACKAGE  Package spec: npm name, git URL, local directory, or tarball.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Install a transformation from npm, git, or local path.

ALIASES
  $ synth tx install

EXAMPLES
  $ synth transformation install @aelastics/eer-to-relational

  $ synth transformation install git+https://github.com/user/tx.git

  $ synth transformation install ./my-transformation

  $ synth transformation install ./eer-to-relational-1.0.0.tgz
```

## `synth transformation ls`

List installed transformations with versions.

```
USAGE
  $ synth transformation ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List installed transformations with versions.

ALIASES
  $ synth tx ls

EXAMPLES
  $ synth transformation ls
```

## `synth transformation pack`

Produce a distributable tarball.

```
USAGE
  $ synth transformation pack [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Produce a distributable tarball.

ALIASES
  $ synth tx pack

EXAMPLES
  $ synth transformation pack
```

## `synth transformation publish`

Publish the transformation to npm.

```
USAGE
  $ synth transformation publish [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--access public|restricted] [--tag
    <value>] [--dry-run]

FLAGS
  --access=<option>  Package access level (public or restricted).
                     <options: public|restricted>
  --dry-run          Perform a dry run without actually publishing.
  --tag=<value>      [default: latest] Tag to publish with (e.g., beta, next).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Publish the transformation to npm.

ALIASES
  $ synth tx publish

EXAMPLES
  $ synth transformation publish

  $ synth transformation publish --access public

  $ synth transformation publish --tag beta
```

## `synth transformation run TX`

Run one transformation, or a chain of transformations, on a workspace model.

```
USAGE
  $ synth transformation run TX... --in <value> [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--out <value>]
    [--out-dir <value>] [--default-configs] [--save-config <value> | --config <value>] [--trace <value>] [--save-as
    <value>] [--keep-intermediates] [--overwrite]

ARGUMENTS
  TX...  Installed transformation(s) to run in order.

FLAGS
  --config=<value>       Configuration model ref for step 1 (configuration-based only; later steps take
                         --default-configs).
  --default-configs      Explicitly accept generated default configurations for every configuration-based step not
                         covered by --config.
  --in=<value>           (required) Source model ref the first step transforms.
  --keep-intermediates   Also write every intermediate step result as a workspace model
                         ('<namespace>/<name>-<step-tx>').
  --out=<value>          Destination ref for the final result model (last step m2m only; default:
                         '<namespace>/<name>-<last-tx>' derived from --in).
  --out-dir=<value>      Output directory for generated files (last step m2t only).
  --overwrite            Replace existing targets (final and intermediate models, --save-config target, --save-as
                         pipeline).
  --save-as=<value>      After a successful run, save the steps as a pipeline at pipelines/<name>.json; run it with
                         'pipeline run <name> --in <ref>'.
  --save-config=<value>  Persist the generated default configuration as a workspace model at this ref (single step with
                         --default-configs only).
  --trace=<value>        Persist the run's trace model as a workspace model at this ref (single step only). The trace
                         records, per executed rule, the source element, the produced targets, and every resolved
                         configuration option; when the run used generated defaults, the effective configuration is
                         persisted next to it at '<ref>-config'.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run one transformation, or a chain of transformations, on a workspace model.

  With one transformation: an m2m result is written back into the workspace as a model file (--out; default
  '<namespace>/<name>-<tx>' derived from --in), an m2t result generates files under --out-dir; an existing target is
  only replaced with --overwrite. With several transformations the steps form a chain: step N's output model feeds step
  N+1 in memory (one shared model store), the chain is type-checked from the manifests before execution (step N's target
  metamodel must equal step N+1's source metamodel), and only the last step may be m2t (text is terminal; it requires
  --out-dir). Pass --keep-intermediates to also persist every intermediate result as a workspace model at
  '<namespace>/<name>-<step-tx>'. Configuration consent is explicit everywhere: --config binds to step 1 only, and every
  other configuration-based step (and step 1 without --config) requires --default-configs; without it the run aborts
  before any engine work. --save-config persists the generated default configuration (single step, only together with
  --default-configs); for chains, run stepwise with 'transformation run' and 'config init'. After a successful run,
  --save-as <name> saves the steps as a pipeline at pipelines/<name>.json (the process only, no data bindings),
  replayable with 'synth pipeline run <name> --in <ref>'. In a terminal session, missing values are asked for
  interactively: no transformation opens a picker over the installed transformations, a missing --in over the models
  matching the source metamodel, an unconsented configuration-based step offers --config/--default-configs explicitly,
  and a missing --out-dir is prompted for. Piped, scripted, --json, --quiet, and CI invocations never prompt. Exit
  codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration, or a
  result that fails the import gate, 3 for an unknown transformation or model.

ALIASES
  $ synth tx run

EXAMPLES
  $ synth transformation run eer-to-relational --in com.example/persons --config com.example/persons-cfg

  $ synth transformation run eer-to-relational --in com.example/persons --default-configs --out com.example/persons-rel

  $ synth transformation run eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir ./generated --save-as gen-sql
```

## `synth transformation show NAME`

Print the transformation's kind, source/target metamodels, and variability points.

```
USAGE
  $ synth transformation show NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the transformation to show.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Print the transformation's kind, source/target metamodels, and variability points.

ALIASES
  $ synth tx show

EXAMPLES
  $ synth transformation show eer-to-relational
```

## `synth transformation test`

Run test fixtures against the built transformation.

```
USAGE
  $ synth transformation test [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run test fixtures against the built transformation.

ALIASES
  $ synth tx test

EXAMPLES
  $ synth transformation test
```

## `synth transformation uninstall NAME`

Remove an installed transformation.

```
USAGE
  $ synth transformation uninstall NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the transformation to uninstall.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Remove an installed transformation.

  Refused while any saved pipeline lists the transformation as a step (running the pipeline would break); update those
  pipelines or delete them with 'synth pipeline rm' first, as there is no cascade. An invalid pipeline file still
  protects its steps: its step list is read best-effort, because repairing the file with 'synth pipeline edit' must stay
  possible.

ALIASES
  $ synth tx uninstall

EXAMPLES
  $ synth transformation uninstall eer-to-relational
```

## `synth tx build`

Build the transformation in the current directory.

```
USAGE
  $ synth tx build [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Build the transformation in the current directory.

ALIASES
  $ synth tx build

EXAMPLES
  $ synth tx build
```

## `synth tx init NAME`

Scaffold a new transformation project.

```
USAGE
  $ synth tx init NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name for the new transformation project.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Scaffold a new transformation project.

ALIASES
  $ synth tx init

EXAMPLES
  $ synth tx init eer-to-relational
```

## `synth tx install PACKAGE`

Install a transformation from npm, git, or local path.

```
USAGE
  $ synth tx install PACKAGE [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  PACKAGE  Package spec: npm name, git URL, local directory, or tarball.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Install a transformation from npm, git, or local path.

ALIASES
  $ synth tx install

EXAMPLES
  $ synth tx install @aelastics/eer-to-relational

  $ synth tx install git+https://github.com/user/tx.git

  $ synth tx install ./my-transformation

  $ synth tx install ./eer-to-relational-1.0.0.tgz
```

## `synth tx ls`

List installed transformations with versions.

```
USAGE
  $ synth tx ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List installed transformations with versions.

ALIASES
  $ synth tx ls

EXAMPLES
  $ synth tx ls
```

## `synth tx pack`

Produce a distributable tarball.

```
USAGE
  $ synth tx pack [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Produce a distributable tarball.

ALIASES
  $ synth tx pack

EXAMPLES
  $ synth tx pack
```

## `synth tx publish`

Publish the transformation to npm.

```
USAGE
  $ synth tx publish [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--access public|restricted] [--tag
    <value>] [--dry-run]

FLAGS
  --access=<option>  Package access level (public or restricted).
                     <options: public|restricted>
  --dry-run          Perform a dry run without actually publishing.
  --tag=<value>      [default: latest] Tag to publish with (e.g., beta, next).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Publish the transformation to npm.

ALIASES
  $ synth tx publish

EXAMPLES
  $ synth tx publish

  $ synth tx publish --access public

  $ synth tx publish --tag beta
```

## `synth tx run TX`

Run one transformation, or a chain of transformations, on a workspace model.

```
USAGE
  $ synth tx run TX... --in <value> [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--out <value>]
    [--out-dir <value>] [--default-configs] [--save-config <value> | --config <value>] [--trace <value>] [--save-as
    <value>] [--keep-intermediates] [--overwrite]

ARGUMENTS
  TX...  Installed transformation(s) to run in order.

FLAGS
  --config=<value>       Configuration model ref for step 1 (configuration-based only; later steps take
                         --default-configs).
  --default-configs      Explicitly accept generated default configurations for every configuration-based step not
                         covered by --config.
  --in=<value>           (required) Source model ref the first step transforms.
  --keep-intermediates   Also write every intermediate step result as a workspace model
                         ('<namespace>/<name>-<step-tx>').
  --out=<value>          Destination ref for the final result model (last step m2m only; default:
                         '<namespace>/<name>-<last-tx>' derived from --in).
  --out-dir=<value>      Output directory for generated files (last step m2t only).
  --overwrite            Replace existing targets (final and intermediate models, --save-config target, --save-as
                         pipeline).
  --save-as=<value>      After a successful run, save the steps as a pipeline at pipelines/<name>.json; run it with
                         'pipeline run <name> --in <ref>'.
  --save-config=<value>  Persist the generated default configuration as a workspace model at this ref (single step with
                         --default-configs only).
  --trace=<value>        Persist the run's trace model as a workspace model at this ref (single step only). The trace
                         records, per executed rule, the source element, the produced targets, and every resolved
                         configuration option; when the run used generated defaults, the effective configuration is
                         persisted next to it at '<ref>-config'.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run one transformation, or a chain of transformations, on a workspace model.

  With one transformation: an m2m result is written back into the workspace as a model file (--out; default
  '<namespace>/<name>-<tx>' derived from --in), an m2t result generates files under --out-dir; an existing target is
  only replaced with --overwrite. With several transformations the steps form a chain: step N's output model feeds step
  N+1 in memory (one shared model store), the chain is type-checked from the manifests before execution (step N's target
  metamodel must equal step N+1's source metamodel), and only the last step may be m2t (text is terminal; it requires
  --out-dir). Pass --keep-intermediates to also persist every intermediate result as a workspace model at
  '<namespace>/<name>-<step-tx>'. Configuration consent is explicit everywhere: --config binds to step 1 only, and every
  other configuration-based step (and step 1 without --config) requires --default-configs; without it the run aborts
  before any engine work. --save-config persists the generated default configuration (single step, only together with
  --default-configs); for chains, run stepwise with 'transformation run' and 'config init'. After a successful run,
  --save-as <name> saves the steps as a pipeline at pipelines/<name>.json (the process only, no data bindings),
  replayable with 'synth pipeline run <name> --in <ref>'. In a terminal session, missing values are asked for
  interactively: no transformation opens a picker over the installed transformations, a missing --in over the models
  matching the source metamodel, an unconsented configuration-based step offers --config/--default-configs explicitly,
  and a missing --out-dir is prompted for. Piped, scripted, --json, --quiet, and CI invocations never prompt. Exit
  codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration, or a
  result that fails the import gate, 3 for an unknown transformation or model.

ALIASES
  $ synth tx run

EXAMPLES
  $ synth tx run eer-to-relational --in com.example/persons --config com.example/persons-cfg

  $ synth tx run eer-to-relational --in com.example/persons --default-configs --out com.example/persons-rel

  $ synth tx run eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir ./generated --save-as gen-sql
```

## `synth tx show NAME`

Print the transformation's kind, source/target metamodels, and variability points.

```
USAGE
  $ synth tx show NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the transformation to show.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Print the transformation's kind, source/target metamodels, and variability points.

ALIASES
  $ synth tx show

EXAMPLES
  $ synth tx show eer-to-relational
```

## `synth tx test`

Run test fixtures against the built transformation.

```
USAGE
  $ synth tx test [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run test fixtures against the built transformation.

ALIASES
  $ synth tx test

EXAMPLES
  $ synth tx test
```

## `synth tx uninstall NAME`

Remove an installed transformation.

```
USAGE
  $ synth tx uninstall NAME [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  NAME  Name of the transformation to uninstall.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Remove an installed transformation.

  Refused while any saved pipeline lists the transformation as a step (running the pipeline would break); update those
  pipelines or delete them with 'synth pipeline rm' first, as there is no cascade. An invalid pipeline file still
  protects its steps: its step list is read best-effort, because repairing the file with 'synth pipeline edit' must stay
  possible.

ALIASES
  $ synth tx uninstall

EXAMPLES
  $ synth tx uninstall eer-to-relational
```

## `synth workspace`

Print or switch the active workspace.

```
USAGE
  $ synth workspace [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--set <value>]

FLAGS
  --set=<value>  Switch the active workspace to this path.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Print or switch the active workspace.

EXAMPLES
  $ synth workspace

  $ synth workspace --set ~/other-workspace
```

---

*Generated by oclif readme. Do not edit manually.*
