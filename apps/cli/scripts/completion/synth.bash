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
  # contract. Bash splits words at '=' (COMP_WORDBREAKS), turning
  # '--in=com' into the three tokens '--in', '=', 'com': reassemble them
  # so the CLI sees the single-token '--flag=partial' form it understands.
  local -a words=()
  local i w last
  for ((i = 1; i <= COMP_CWORD; i++)); do
    w="${COMP_WORDS[i]}"
    if ((${#words[@]} > 0)); then
      last="${words[${#words[@]}-1]}"
      if [[ "$w" == "=" && "$last" == --* ]]; then
        words[${#words[@]}-1]="$last="
        continue
      fi
      if [[ "$last" == --*= ]]; then
        words[${#words[@]}-1]="$last$w"
        continue
      fi
    fi
    words+=("$w")
  done

  # Bash replaces only the region after the '=' wordbreak, so filter with
  # that part. When '=' is NOT in COMP_WORDBREAKS (custom setups), the
  # whole '--flag=partial' word is replaced instead — candidates must then
  # carry the '--flag=' prefix back.
  local prefix=""
  if [[ "$cur" == "=" ]]; then
    cur=""
  elif [[ "$cur" == --*=* ]]; then
    prefix="${cur%%=*}="
    cur="${cur#*=}"
  fi

  local values
  values="$(synth completions -- "${words[@]}" 2>/dev/null)"
  if [[ -n "$values" ]]; then
    local IFS=$'\n'
    COMPREPLY=($(compgen -W "$values" -- "$cur"))
    if [[ -n "$prefix" ]] && ((${#COMPREPLY[@]} > 0)); then
      COMPREPLY=("${COMPREPLY[@]/#/$prefix}")
    fi
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
