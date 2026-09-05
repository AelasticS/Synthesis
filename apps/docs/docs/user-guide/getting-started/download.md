---
sidebar_position: 1
---

# Download

The `synth` CLI ships as a self-contained bundle per platform. Each bundle
includes Node.js and all dependencies; nothing else needs to be installed
on your machine.

**Current version: v0.2.0.** Release notes for every version are in the
[changelog](https://github.com/AelasticS/Synthesis/blob/main/CHANGELOG.md),
and the
[releases page](https://github.com/AelasticS/Synthesis/releases) lists all
versions with their bundles.

| Platform | Architecture | Download |
|---|---|---|
| Linux | x64 | [synth-v0.2.0-linux-x64.tar.gz](https://github.com/AelasticS/Synthesis/releases/download/cli-v0.2.0/synth-v0.2.0-linux-x64.tar.gz) |
| Linux | arm64 | [synth-v0.2.0-linux-arm64.tar.gz](https://github.com/AelasticS/Synthesis/releases/download/cli-v0.2.0/synth-v0.2.0-linux-arm64.tar.gz) |
| macOS | Intel (x64) | [synth-v0.2.0-darwin-x64.tar.gz](https://github.com/AelasticS/Synthesis/releases/download/cli-v0.2.0/synth-v0.2.0-darwin-x64.tar.gz) |
| macOS | Apple Silicon (arm64) | [synth-v0.2.0-darwin-arm64.tar.gz](https://github.com/AelasticS/Synthesis/releases/download/cli-v0.2.0/synth-v0.2.0-darwin-arm64.tar.gz) |
| Windows | x64 | [synth-v0.2.0-win32-x64.tar.gz](https://github.com/AelasticS/Synthesis/releases/download/cli-v0.2.0/synth-v0.2.0-win32-x64.tar.gz) |

:::note Platform support in v0.2.0
The Linux bundles are validated end to end. The macOS and Windows bundles
are published but carry a known limitation: the release is built on a
Linux runner and includes a platform-specific transpiler binary
(`esbuild`), so importing and running model files may fail on those
platforms in this version. macOS and Windows users can
[build from source](./installation.md#build-from-source) instead, which
works everywhere. Fully native bundles are planned for a future release.
:::

After downloading, continue with [Installation](./installation.md): extract
the archive and add `synth/bin` to your `PATH`.
