---
sidebar_position: 2
---

# Installation

The `synth` CLI is distributed as a self-contained tarball from
[GitHub Releases](https://github.com/AelasticS/Synthesis/releases). The
tarball bundles Node.js and all dependencies — **no separate Node install
is required**.

Two install paths are supported:

1. **[Tarball install](#tarball-install)** — the recommended path for end users.
2. **[Build from source](#build-from-source)** — for contributors and users
   who want the latest unreleased changes.

## Tarball install

### Linux and macOS

Pick the tarball matching your platform from the
[latest release](https://github.com/AelasticS/Synthesis/releases/latest),
extract it, and add the resulting `synth/bin` to your `PATH`.

```bash
# Choose one of:
#   synth-v0.1.0-linux-x64.tar.gz
#   synth-v0.1.0-linux-arm64.tar.gz
#   synth-v0.1.0-darwin-x64.tar.gz
#   synth-v0.1.0-darwin-arm64.tar.gz
VERSION=v0.1.0
TARGET=linux-x64         # adjust for your platform
URL="https://github.com/AelasticS/Synthesis/releases/download/cli-${VERSION}/synth-${VERSION}-${TARGET}.tar.gz"

# Download and extract under /usr/local
curl -L "$URL" | sudo tar -xz -C /usr/local

# Add synth to PATH (one-time, pick your shell's rc file)
echo 'export PATH="/usr/local/synth/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Windows

Download the matching `synth-v0.1.0-win32-x64.tar.gz` from the
[latest release](https://github.com/AelasticS/Synthesis/releases/latest)
and extract it (with 7-Zip, or `tar -xzf` in PowerShell 5+). Then add
the extracted `synth\bin` folder to your user `PATH`:

```powershell
# In an elevated PowerShell, after extracting to C:\synth
[Environment]::SetEnvironmentVariable(
  'Path',
  $env:Path + ';C:\synth\bin',
  [EnvironmentVariableTarget]::User
)
```

Open a new terminal for the PATH change to take effect.

## Build from source

For contributors, or to run the latest unreleased CLI:

### Prerequisites

- **Node.js** ≥ 22 — see [nodejs.org](https://nodejs.org/) or use
  [`nvm`](https://github.com/nvm-sh/nvm).
- **pnpm** ≥ 9 — see [pnpm.io](https://pnpm.io/installation).
- **Rush** ≥ 5 — installed automatically by the build scripts; no manual
  install required.

### Steps

```bash
git clone https://github.com/AelasticS/Synthesis.git
cd Synthesis
node common/scripts/install-run-rush.js install
node common/scripts/install-run-rush.js rebuild

# Link the built CLI as `synth` on your PATH
cd apps/cli
pnpm link --global

synth --version
```

The linked `synth` binary points at `apps/cli/bin/run.js` in your clone,
so any further `rush build` picks up source changes immediately.

To unlink:

```bash
cd apps/cli
pnpm unlink --global
```

## Verifying the install

```bash
synth --version
synth init
synth doctor
```

- `--version` prints the installed CLI version.
- `init` creates the workspace at `~/.synth/` (override with
  `--path <dir>`).
- `doctor` runs a health check against the workspace and reports any
  problems.

## Upgrading

**Tarball install:** re-run the install steps above with the new version.
Replacing the extracted directory in place is enough; your workspace at
`~/.synth/` is untouched.

**Source install:** `git pull && node common/scripts/install-run-rush.js rebuild`.

## Uninstalling

**Tarball install:**

```bash
sudo rm -rf /usr/local/synth
# remove the PATH entry you added in ~/.bashrc (or equivalent)
```

**Source install:**

```bash
cd apps/cli && pnpm unlink --global
```

The workspace at `~/.synth/` is **not** removed by either. Delete it
manually if you want to discard all locally installed transformations,
models, and configs:

```bash
rm -rf ~/.synth
```
