# synth: dynamic zsh completion (values: transformation names, model and
# configuration refs, pipeline names, namespaces).
#
# How it works: on TAB this wrapper asks the CLI itself for the candidate
# VALUES of the current cursor position (`synth completions -- <words...>`,
# a fast, engine-free lookup over the workspace's manifests and model
# headers). When the CLI has no value candidates for the position, the
# wrapper falls back to the command/flag completion that
# @oclif/plugin-autocomplete generates (`_synth`), when that is loaded,
# and to zsh's default completion otherwise.
#
# One-time setup, in this order in ~/.zshrc (after `compinit`):
#
#   1. (optional, for command/flag completion)
#      printf "eval \$(synth autocomplete script zsh)" >> ~/.zshrc
#      # or run `synth autocomplete zsh` and follow its instructions
#   2. source this file AFTER it:
#      source /path/to/scripts/completion/synth.zsh
#
# Sourcing this file last matters: both registrations claim the `synth`
# command, and this one must win so values complete; it delegates to the
# plugin's function for everything it does not handle.
#
# Limitations: completion is TAB-triggered only, requires this one-time
# setup, and bash/zsh are the first-class shells (no powershell wiring).

_synth_dynamic() {
  # $words[1] is 'synth'; pass words 2..CURRENT, up to AND INCLUDING the
  # word under the cursor ('' when a new word is being started): the
  # `synth completions` contract. Zsh keeps '--flag=partial' as ONE word,
  # which the CLI understands as-is.
  local -a cli_words
  cli_words=("${(@)words[2,CURRENT]}")

  local -a values
  values=("${(@f)$(synth completions -- "${cli_words[@]}" 2>/dev/null)}")
  if (( ${#values[@]} )) && [[ -n "${values[1]}" ]]; then
    # For a '--flag=partial' word, only the part after the first '=' is
    # being completed: move '--flag=' into the ignored prefix so the
    # inserted candidate does not replace the flag itself.
    if [[ "${words[CURRENT]}" == -*=* ]]; then
      compset -P '1*='
    fi
    compadd -- "${values[@]}"
    return 0
  fi

  # No value candidates here: defer to the oclif-generated command/flag
  # completion when it is loaded; otherwise offer default completion.
  if (( ${+functions[_synth]} )); then
    _synth
    return $?
  fi
  _default
}

compdef _synth_dynamic synth
