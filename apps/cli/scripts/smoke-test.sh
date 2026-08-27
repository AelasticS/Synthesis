#!/usr/bin/env bash
# =============================================================================
# synth CLI smoke tests — end-to-end scenarios through the real binary.
#
# Run:  rushx smoke          (from apps/cli)
#   or: bash scripts/smoke-test.sh
#
# Uses an isolated HOME under mktemp; never touches the developer's ~/.synth.
# Complements the Jest suites: those verify components in isolation, this
# script verifies the composed user journey. One section per plan phase
# (design/cli-execution/plan.md); extend with a new section per new phase.
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="node $ROOT/bin/run.js"
FIXTURE="$ROOT/src/models/__tests__/fixtures/persons.tsx"
TX_M2M="$ROOT/src/tx/__tests__/fixtures/eer-to-relational"
TX_M2T="$ROOT/src/tx/__tests__/fixtures/rel-to-sql-ddl"

WORK="$(mktemp -d /tmp/synth-smoke-XXXXXX)"
export HOME="$WORK/home"
mkdir -p "$HOME"
MODELS="$HOME/.synth/models"

PASS=0; FAIL=0
say()  { printf '\n== %s\n' "$1"; }
ok()   { PASS=$((PASS + 1)); printf '   [ok] %s\n' "$1"; }
bad()  { FAIL=$((FAIL + 1)); printf '   [FAIL] %s\n' "$1"; }

# run <desc> <expected-exit> <grep-pattern|-> <cli args...>
# Asserts the exit code and (unless '-') that combined output matches the pattern.
run() {
  local desc="$1" want="$2" pat="$3"; shift 3
  local out status
  out="$($CLI "$@" 2>&1)"; status=$?
  if [ "$status" -ne "$want" ]; then
    bad "$desc (exit $status, wanted $want)"; printf '%s\n' "$out" | sed 's/^/     | /'
    return 1
  fi
  if [ "$pat" != "-" ] && ! printf '%s' "$out" | grep -q "$pat"; then
    bad "$desc (missing '$pat')"; printf '%s\n' "$out" | sed 's/^/     | /'
    return 1
  fi
  ok "$desc"
}

# =============================================================================
# Phase 1 — workspace and model management
# The workspace is created, a model enters through the import gate, header
# metadata is visible everywhere, doctor guards integrity, and deletion is
# protected by the reverse-dependency graph (RESTRICT / --cascade).
# =============================================================================
say "Phase 1: workspace + model management"

run "init creates a workspace"            0 "initialized"          init
run "ns mk creates nested namespace"      0 -                      ns mk com.example
run "model import through the gate"       0 "Imported"             model import "$FIXTURE" --as com.example/persons
test -f "$MODELS/com/example/persons.tsx" && ok "nested path on disk" || bad "nested path on disk"
run "model ls shows header columns"       0 "com.example/persons"  model ls
run "model show displays metamodel"       0 "standard-metamodels/eer" model show com.example/persons
run "model validate renders for real"     0 "is valid"             model validate com.example/persons
run "doctor clean on healthy workspace"   0 "0 errors"             doctor

# Deletion guard: make a second model reference the first, then try to delete
run "import dependent model"              0 "Imported"             model import "$FIXTURE" --as com.example/dependent
sed -i "s|references: {}|references: { basedOn: 'com.example/persons' }|" "$MODELS/com/example/dependent.tsx"
run "rm refused while referenced (graph shown)" 2 "com.example/dependent" model rm com.example/persons
run "rm --cascade deletes the closure"    0 "Deleted com.example/dependent" model rm com.example/persons --cascade
run "doctor clean after cascade"          0 "0 errors"             doctor

# Export round-trip
run "reimport for export test"            0 "Imported"             model import "$FIXTURE" --as com.example/persons
run "model export writes the file"        0 "Exported"             model export com.example/persons --to "$WORK/exported.tsx"
run "exported model reimports cleanly"    0 "Imported"             model import "$WORK/exported.tsx" --as com.example/persons-copy
run "round-tripped model validates"       0 "is valid"             model validate com.example/persons-copy

# =============================================================================
# Phase 2 — transformation execution (tx install / show / run)
# Manifest-driven install, M2M execution with announced default decisions and
# a provenance-stamped output model that passes the import gate, then M2T
# generating SQL from the produced relational model.
# =============================================================================
say "Phase 2: transformation execution"

run "tx install m2m fixture"              0 "eer-to-relational"    tx install "$TX_M2M"
run "tx install m2t fixture"              0 "rel-to-sql-ddl"       tx install "$TX_M2T"
run "tx show is manifest-driven"          0 "m2m"                  tx show eer-to-relational
run "tx run m2m announces defaults"       0 "SnakeCase (default)"  tx run eer-to-relational --in com.example/persons --out com.example/persons-rel
run "output model records provenance"     0 "eer-to-relational"    model show com.example/persons-rel --json
run "generated model passes validate"     0 "is valid"             model validate com.example/persons-rel
run "tx run m2t generates SQL"            0 "Wrote"                tx run rel-to-sql-ddl --in com.example/persons-rel --out-dir "$WORK/gen"
grep -q "CREATE TABLE person" "$WORK/gen"/*.sql && ok "SQL contains snake_case DDL" || bad "SQL contains snake_case DDL"
run "metamodel mismatch is rejected"      2 "mismatch"             tx run rel-to-sql-ddl --in com.example/persons --out-dir "$WORK/gen2"
run "unknown transformation exits 3"      3 -                      tx run no-such-tx --in com.example/persons

# =============================================================================
# Phase 3 — configuration flow (config init / edit / tx run --config)
# Defaults are generated as an editable workspace model; edited choices steer
# the transformation; partial configs get real (announced AND applied)
# defaults; save-config cannot clobber the input model.
# =============================================================================
say "Phase 3: configuration flow"

run "config init generates defaults"      0 "persons-cfg"          config init eer-to-relational --for com.example/persons
run "config ls lists the configuration"   0 "persons-cfg"          config ls
run "config show renders decisions"       0 "NamingConvention"     config show com.example/persons-cfg

# Edited choice steers the transformation: SnakeCase -> CamelCase
sed -i "s/SnakeCase/CamelCase/g" "$MODELS/com/example/persons-cfg.tsx"
run "tx run --config applies edited choice" 0 "CamelCase"          tx run eer-to-relational --in com.example/persons --config com.example/persons-cfg --out com.example/rel-camel
grep -q 'name="personId"' "$MODELS/com/example/rel-camel.tsx" && ok "output uses CamelCase columns" || bad "output uses CamelCase columns"

# Partial config: delete a whole choice — the default must be announced AND applied
run "second config for partial test"      0 "cfg-partial"          config init eer-to-relational --for com.example/persons --out com.example/cfg-partial
python3 - "$MODELS/com/example/cfg-partial.tsx" <<'EOF'
import re, sys
p = sys.argv[1]
s = open(p).read()
s2 = re.sub(r'    <GlobalChoice[\s\S]*?    />\n', '', s, count=1)
assert s2 != s, 'GlobalChoice removal pattern did not match'
open(p, 'w').write(s2)
EOF
run "partial config announces the default" 0 "SnakeCase (default)" tx run eer-to-relational --in com.example/persons --config com.example/cfg-partial --out com.example/rel-partial
grep -q 'name="person_id"' "$MODELS/com/example/rel-partial.tsx" && ok "default was actually applied" || bad "default was actually applied"

run "save-config cannot clobber the input" 1 "overwrite the input model" tx run eer-to-relational --in com.example/persons --save-config com.example/persons --overwrite --out com.example/never
run "doctor clean at the end"             0 "0 errors"             doctor

# =============================================================================
say "Summary"
printf '   passed: %d   failed: %d\n' "$PASS" "$FAIL"
rm -rf "$WORK"
[ "$FAIL" -eq 0 ] || exit 1
