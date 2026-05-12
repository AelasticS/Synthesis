# @synthesis/cli

Synthesis model-driven engineering CLI.

## Installation

```bash
npm install -g @synthesis/cli
```

## Usage

```bash
synth --help
```

## Commands

<!-- commands -->
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
* [`synth m2t MODEL`](#synth-m2t-model)
* [`synth model export REF`](#synth-model-export-ref)
* [`synth model import FILE`](#synth-model-import-file)
* [`synth model ls`](#synth-model-ls)
* [`synth model rm REF`](#synth-model-rm-ref)
* [`synth model show REF`](#synth-model-show-ref)
* [`synth model validate REF`](#synth-model-validate-ref)
* [`synth ns ls`](#synth-ns-ls)
* [`synth ns mk NAMESPACE`](#synth-ns-mk-namespace)
* [`synth ns rm NAMESPACE`](#synth-ns-rm-namespace)
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
* [`synth run TX`](#synth-run-tx)
* [`synth tx build`](#synth-tx-build)
* [`synth tx init NAME`](#synth-tx-init-name)
* [`synth tx install PACKAGE`](#synth-tx-install-package)
* [`synth tx ls`](#synth-tx-ls)
* [`synth tx pack`](#synth-tx-pack)
* [`synth tx publish`](#synth-tx-publish)
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

Open the configuration in $EDITOR.

```
USAGE
  $ synth config edit REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Configuration ref to edit.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Open the configuration in $EDITOR.

EXAMPLES
  $ synth config edit com.example/library.cfg
```

## `synth config init TX`

Generate a default configuration for a transformation.

```
USAGE
  $ synth config init TX --for <value> [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--out <value>]

ARGUMENTS
  TX  Transformation to create a configuration for.

FLAGS
  --for=<value>  (required) Model ref this configuration applies to.
  --out=<value>  Ref to store the configuration as.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Generate a default configuration for a transformation.

EXAMPLES
  $ synth config init eer-to-relational --for com.example/library
```

## `synth config ls`

List configurations, optionally filtered by transformation.

```
USAGE
  $ synth config ls [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--for <value>]

FLAGS
  --for=<value>  Filter configurations by transformation name.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  List configurations, optionally filtered by transformation.

EXAMPLES
  $ synth config ls

  $ synth config ls --for eer-to-relational
```

## `synth config rm REF`

Delete a configuration.

```
USAGE
  $ synth config rm REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Configuration ref to delete.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a configuration.

EXAMPLES
  $ synth config rm com.example/library.cfg
```

## `synth config show REF`

Print the current value of every binding in a configuration.

```
USAGE
  $ synth config show REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Configuration ref to show.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Print the current value of every binding in a configuration.

EXAMPLES
  $ synth config show com.example/library.cfg
```

## `synth doctor`

Check workspace integrity: missing files, broken references.

```
USAGE
  $ synth doctor [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

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

## `synth m2t MODEL`

Run a model-to-text transformation.

```
USAGE
  $ synth m2t MODEL --template <value> --out <value> [--workspace <value>] [--ns <value>] [--json] [-q]
    [-v] [--dry-run]

ARGUMENTS
  MODEL  Model ref to transform.

FLAGS
  --dry-run           Print the files that would be written, without writing them.
  --out=<value>       (required) Output directory on disk.
  --template=<value>  (required) Path or installed name of the M2T template.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run a model-to-text transformation.

EXAMPLES
  $ synth m2t com.example/library --template eer-java --out ./src-gen
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
  $ synth model export com.example/order-1

  $ synth model export com.example/order-1 --to ./out/order.json
```

## `synth model import FILE`

Copy a JSON file from disk into the workspace.

```
USAGE
  $ synth model import FILE [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--as <value>]

ARGUMENTS
  FILE  Path to the JSON file to import.

FLAGS
  --as=<value>  Ref to assign to the imported model (namespace/name).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Copy a JSON file from disk into the workspace.

EXAMPLES
  $ synth model import ./examples/order.json

  $ synth model import ./examples/order.json --as com.example/order-1
```

## `synth model ls`

List all models in the current namespace.

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
  List all models in the current namespace.

EXAMPLES
  $ synth model ls

  $ synth model ls --ns com.example.orders
```

## `synth model rm REF`

Delete a model from the workspace.

```
USAGE
  $ synth model rm REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v]

ARGUMENTS
  REF  Model ref to delete.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Delete a model from the workspace.

EXAMPLES
  $ synth model rm com.example/order-1
```

## `synth model show REF`

Read and display a model file.

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
  Read and display a model file.

EXAMPLES
  $ synth model show com.example/order-1
```

## `synth model validate REF`

Check the model against its metamodel.

```
USAGE
  $ synth model validate REF [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--against <value>]

ARGUMENTS
  REF  Model ref to validate.

FLAGS
  --against=<value>  Metamodel to validate against (defaults to model header).

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Check the model against its metamodel.

EXAMPLES
  $ synth model validate com.example/order-1

  $ synth model validate com.example/order-1 --against @aelastics/order-metamodel
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

EXAMPLES
  $ synth ns mk com.example.orders
```

## `synth ns rm NAMESPACE`

Remove a namespace (must be empty unless --force).

```
USAGE
  $ synth ns rm NAMESPACE [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--force]

ARGUMENTS
  NAMESPACE  Name of the namespace to remove.

FLAGS
  --force  Remove even if the namespace contains models.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Remove a namespace (must be empty unless --force).

EXAMPLES
  $ synth ns rm com.example.orders

  $ synth ns rm com.example.orders --force
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

## `synth run TX`

Run a model-to-model transformation.

```
USAGE
  $ synth run TX --in <value> [--workspace <value>] [--ns <value>] [--json] [-q] [-v] [--config <value>]
    [--out <value>] [--overwrite]

ARGUMENTS
  TX  Name of the installed transformation to run.

FLAGS
  --config=<value>  Configuration ref for variability resolution.
  --in=<value>      (required) Source model ref to transform.
  --out=<value>     Destination ref for the result model.
  --overwrite       Replace the target model if it already exists.

GLOBAL FLAGS
  -q, --quiet              Suppress informational output.
  -v, --verbose            Print debug-level logs.
      --json               Emit machine-readable JSON.
      --ns=<value>         Namespace context override (otherwise resolved from config).
      --workspace=<value>  Override active workspace for this invocation.

DESCRIPTION
  Run a model-to-model transformation.

EXAMPLES
  $ synth run eer-to-relational --in com.example/library

  $ synth run eer-to-relational --in com.example/library --config com.example/library.cfg --out com.example/library.rel
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

EXAMPLES
  $ synth tx publish

  $ synth tx publish --access public

  $ synth tx publish --tag beta
```

## `synth tx show NAME`

Print the transformation's source metamodel, target metamodel, and variability points.

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
  Print the transformation's source metamodel, target metamodel, and variability points.

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
<!-- commandsstop -->
