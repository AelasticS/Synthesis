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
# Manifest-driven install; decisions are never applied without explicit
# consent (--default-configs), then M2M execution with announced default
# decisions and a provenance-stamped output model that passes the import
# gate, then M2T generating SQL from the produced relational model.
# =============================================================================
say "Phase 2: transformation execution"

run "tx install m2m fixture"              0 "eer-to-relational"    tx install "$TX_M2M"
run "tx install m2t fixture"              0 "rel-to-sql-ddl"       tx install "$TX_M2T"
run "tx show is manifest-driven"          0 "m2m"                  tx show eer-to-relational
run "decision-based run aborts without consent" 2 "decision-based" tx run eer-to-relational --in com.example/persons --out com.example/persons-rel
run "tx run m2m announces defaults"       0 "SnakeCase (default)"  tx run eer-to-relational --in com.example/persons --default-configs --out com.example/persons-rel
run "output model records provenance"     0 "eer-to-relational"    model show com.example/persons-rel --json
run "generated model passes validate"     0 "is valid"             model validate com.example/persons-rel
run "tx run m2t generates SQL"            0 "Wrote"                tx run rel-to-sql-ddl --in com.example/persons-rel --default-configs --out-dir "$WORK/gen"
grep -q "CREATE TABLE person" "$WORK/gen"/*.sql && ok "SQL contains snake_case DDL" || bad "SQL contains snake_case DDL"
grep -q "REFERENCES organization" "$WORK/gen"/*.sql && ok "FK REFERENCES matches the created table name" || bad "FK REFERENCES matches the created table name"
run "metamodel mismatch is rejected"      2 "mismatch"             tx run rel-to-sql-ddl --in com.example/persons --default-configs --out-dir "$WORK/gen2"
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

run "save-config requires default-configs" 1 "only valid together"  tx run eer-to-relational --in com.example/persons --save-config com.example/cfg-solo --out com.example/never
run "save-config cannot clobber the input" 1 "overwrite the input model" tx run eer-to-relational --in com.example/persons --default-configs --save-config com.example/persons --overwrite --out com.example/never
run "doctor clean at the end"             0 "0 errors"             doctor

# =============================================================================
# Phase 4 — chaining `run`
# One execution core behind tx run and run: chains hand the result model to
# the next step in memory, are type-checked from manifests up front, apply
# the uniform explicit-consent policy (--config binds to step 1 only, all
# other decision-based steps take --default-configs), and only the last
# step may be m2t. --keep-intermediates persists mid-chain results as
# workspace models; the stepwise path (config init against a kept
# intermediate) configures later steps explicitly.
# =============================================================================
say "Phase 4: chaining"

run "chain generates SQL with default configs" 0 "IdentifierQuoting -> Unquoted (default)" run eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir "$WORK/chain-gen"
grep -q "CREATE TABLE person" "$WORK/chain-gen"/*.sql && ok "chained SQL contains CREATE TABLE" || bad "chained SQL contains CREATE TABLE"
run "chain aborts without consent"        2 "decision-based"       run eer-to-relational rel-to-sql-ddl --in com.example/persons --out-dir "$WORK/chain-never"
run "config steers step 1, defaults cover step 2" 0 "CamelCase"    run eer-to-relational rel-to-sql-ddl --in com.example/persons --config com.example/persons-cfg --default-configs --out-dir "$WORK/chain-camel"
grep -q "personId" "$WORK/chain-camel"/*.sql && ok "step-1 config visible in chained SQL" || bad "step-1 config visible in chained SQL"
run "m2t mid-chain is rejected"           1 "last step"            run rel-to-sql-ddl rel-to-sql-ddl --in com.example/persons --default-configs --out-dir "$WORK/chain-never"
run "metamodel-mismatched chain is rejected" 2 "Chain type mismatch" run eer-to-relational eer-to-relational --in com.example/persons --default-configs --out com.example/never-chain
run "keep-intermediates writes the intermediate" 0 "persons-eer-to-relational" run eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --keep-intermediates --out-dir "$WORK/chain-keep"
test -f "$MODELS/com/example/persons-eer-to-relational.tsx" && ok "intermediate model file exists" || bad "intermediate model file exists"
run "intermediate passes validate"        0 "is valid"             model validate com.example/persons-eer-to-relational

# Stepwise configuration of step 2: config init against the kept
# intermediate, select DoubleQuoted, and the emitted DDL quotes identifiers
run "config init against the intermediate" 0 "IdentifierQuoting -> Unquoted (default)" config init rel-to-sql-ddl --for com.example/persons-eer-to-relational
sed -i "s/Unquoted/DoubleQuoted/g" "$MODELS/com/example/persons-eer-to-relational-cfg.tsx"
run "tx run applies the DoubleQuoted config" 0 "IdentifierQuoting -> DoubleQuoted" tx run rel-to-sql-ddl --in com.example/persons-eer-to-relational --config com.example/persons-eer-to-relational-cfg --out-dir "$WORK/chain-quoted"
grep -q 'CREATE TABLE "person"' "$WORK/chain-quoted"/*.sql && ok "DDL identifiers are double-quoted" || bad "DDL identifiers are double-quoted"
grep -q 'REFERENCES "organization"' "$WORK/chain-quoted"/*.sql && ok "quoted FK REFERENCES matches the quoted table name" || bad "quoted FK REFERENCES matches the quoted table name"

# =============================================================================
# Phase 5 — pipelines
# A pipeline is a saved invocation of the chaining run: --save-as persists
# steps + bindings as plain JSON at pipelines/<name>.json; `run <name>`
# replays it through the full normal pre-flight, with invocation flags
# overriding the saved values. Deletion guards keep saved pipelines
# replayable: tx uninstall refuses while a pipeline uses the tx as a step,
# model rm refuses while a pipeline binds the model (no cascade into
# pipelines — update them or `pipeline rm` first).
# =============================================================================
say "Phase 5: pipelines"

run "chain with --save-as saves the pipeline" 0 "Saved pipeline 'gen-sql'" run eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir "$WORK/p5-gen" --save-as gen-sql
test -f "$HOME/.synth/pipelines/gen-sql.json" && ok "pipeline file exists" || bad "pipeline file exists"
run "run gen-sql replays the saved chain"  0 "Wrote"               run gen-sql
grep -q "CREATE TABLE person" "$WORK/p5-gen"/*.sql && ok "replayed SQL produced" || bad "replayed SQL produced"
run "replay with --out-dir override"       0 "Wrote"               run gen-sql --out-dir "$WORK/p5-elsewhere"
grep -q "CREATE TABLE person" "$WORK/p5-elsewhere"/*.sql && ok "override SQL produced elsewhere" || bad "override SQL produced elsewhere"
run "import a second source model"         0 "Imported"            model import "$FIXTURE" --as com.example/persons2
run "replay with --in override on it"      0 "Wrote"               run gen-sql --in com.example/persons2 --out-dir "$WORK/p5-in-override"
grep -q "CREATE TABLE person" "$WORK/p5-in-override"/*.sql && ok "in-override SQL produced" || bad "in-override SQL produced"
run "save-as shadowing a tx is rejected"   1 "shadow"              run eer-to-relational --in com.example/persons --default-configs --out com.example/never --save-as rel-to-sql-ddl
run "tx uninstall refused while gen-sql uses it" 2 "gen-sql"       tx uninstall rel-to-sql-ddl
run "model rm refused while gen-sql reads it"    2 "gen-sql"       model rm com.example/persons --cascade
run "guarded model still present"          0 "com.example/persons" model show com.example/persons
run "pipeline ls lists the pipeline"       0 "gen-sql"             pipeline ls
run "pipeline show displays the steps"     0 "eer-to-relational -> rel-to-sql-ddl" pipeline show gen-sql
run "doctor clean with saved pipeline"     0 "0 errors"            doctor
run "pipeline rm deletes it"               0 "Deleted"             pipeline rm gen-sql
run "pipeline show now exits 3"            3 -                     pipeline show gen-sql
run "tx uninstall works after pipeline rm" 0 "Uninstalled"         tx uninstall rel-to-sql-ddl

# =============================================================================
say "Summary"
printf '   passed: %d   failed: %d\n' "$PASS" "$FAIL"
rm -rf "$WORK"
[ "$FAIL" -eq 0 ] || exit 1
