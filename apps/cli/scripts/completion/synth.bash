# synth — dynamic bash completion (values: transformation names, model and
# configuration refs, pipeline names, namespaces).
#
# How it works: on TAB this wrapper asks the CLI itself for the candidate
# VALUES of the current cursor position (`synth completions -- <words...>`,
# a fast, engine-free lookup over the workspace's manifests and model
# headers). When the CLI has no value candidates for the position, the
# wrapper falls back to the command/flag completion that
# @oclif/plugin-autocomplete generates (`_synth_autocomplete`), when that
# is loaded — and to bash's default (filename) completion otherwise.
#
# One-time setup, in this order in ~/.bashrc:
#
#   1. (optional, for command/flag completion)
#      printf "eval \$(synth autocomplete script bash)" >> ~/.bashrc
#      # or run `synth autocomplete bash` and follow its instructions
#   2. source this file AFTER it:
#      source /path/to/scripts/completion/synth.bash
#
# Sourcing this file last matters: both registrations claim the `synth`
# command, and this one must win so values complete; it delegates to the
# plugin's function for everything it does not handle.
#
# Limitations: completion is TAB-triggered only, requires this one-time
# setup, and bash/zsh are the first-class shells (no powershell wiring).

_synth_dynamic_autocomplete() {
  local cur="${COMP_WORDS[COMP_CWORD]}"

  # Words after the program name up to AND INCLUDING the word under the
  # cursor ('' when a new word is being started) — the `synth completions`
  # contract.
  local -a words=("${COMP_WORDS[@]:1:COMP_CWORD}")

  local values
  values="$(synth completions -- "${words[@]}" 2>/dev/null)"
  if [[ -n "$values" ]]; then
    local IFS=$'\n'
    COMPREPLY=($(compgen -W "$values" -- "$cur"))
    return 0
  fi

  # No value candidates here: defer to the oclif-generated command/flag
  # completion when it is loaded.
  if declare -F _synth_autocomplete >/dev/null; then
    _synth_autocomplete
    return 0
  fi
  COMPREPLY=()
}

# -o default: when neither source produces candidates, fall back to
# readline's default (filename) completion — e.g. for --out-dir values.
complete -o default -F _synth_dynamic_autocomplete synth
