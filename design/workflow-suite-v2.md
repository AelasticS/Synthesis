# The workflow suite v2: definitions and invocations, control flow, documents, and the paper example

Designed with the user across 2026-09-07; this record fixes the
decisions. Two stages: A (this record's execution scope) reshapes the
workflow metamodel and delivers the paper's organizational example; B
(recorded at the end) takes the BPMN side to the standard's
Descriptive conformance subclass.

## The decisions (user)

1. **One workflow metamodel, generalized.** `WorkflowModel` is the
   model root; `Activity` is the abstract generalization with
   `performer` and document interfaces; `Task` is the simple activity,
   `Process` the complex one. SubProcess as a CONCEPT disappears.
2. **Definition and invocation are separate concepts** (the user's
   two-occurrences argument; industry-standard: BPMN's Process/
   GlobalTask vs CallActivity, UML's Activity vs CallBehaviorAction).
   Definitions live at model level; a body invokes them through
   `Invocation` steps with their own occurrence identity. Inline
   authoring stays as single-use sugar (BPMN's embedded sub-process):
   an inline Task or Process in a body is an anonymous single-use
   definition fused with its sole occurrence.
3. **The same split for data** (the user's types-vs-instances
   argument): `DocumentType` at model level (BPMN ItemDefinition);
   activity DEFINITIONS declare `inputs`/`outputs` as DocumentType
   references (the interface, BPMN ioSpecification); `Document` is a
   process-level concrete carrier typed by a DocumentType (BPMN
   DataObject); INVOCATIONS bind them via `reads`/`writes`.
   Conformance is a declared constraint at the validation point, not
   machinery: a bound document's type must be among the called
   definition's declared types.
4. **Control flow completes the operators**: `Choice` with guarded
   `Branch`es (a guardless branch is the else) and ONE `Loop` concept
   with `kind` (while | repeatUntil) and a `guard`. With sequence,
   parallel, choice, and loop the model covers the classical
   structured control-flow patterns ("control-flow complete for
   structured processes"; computational completeness would need
   data, phrase it exactly so).
5. **The paper example joins the suite**: `org-metamodel` (Listing 8)
   and `org-to-approval` (Listing 10), parameterized by
   `{ worker, sensitivity }` through the engine's existing
   `transform(source, param)` channel. The CLI gains `--param <json>`
   (step 1 only, like --config), and the verbatim JSON is recorded in
   the `generatedBy` provenance of every artifact the run writes
   (output model header, trace header): the envelope remembers the
   parameter, answering reproducibility without polluting the model.
   The request-in-model alternative is recorded as the platform-era
   option, not taken (the paper showcases the parameter mechanism).
6. **Terminology**: block-structured workflow model (a process tree);
   performer stays an optional string in stage A (lanes may promote
   it in stage B); tags: `<Invoke>` is the general invocation tag and
   `<SubProcess $refByName="X" />` its process-call sugar (the
   Role/OrdinaryMapping alias idiom).

## The metamodel shape (stage A)

- `WorkflowModel` (Model): contains `DocumentType`s and Activity
  definitions (`Task`, `Process`).
- `Step` (abstract): the unit of a process body.
- Operators (Steps with `children: Step[]`): `Sequence`, `Parallel`,
  `Choice` (children are `Branch`es; `Branch.guard` optional, its
  children an implicit sequence), `Loop` (kind, guard, children an
  implicit sequence).
- `Invocation` (Step): `activity` link to a definition, optional
  occurrence name (defaults to the definition's), `reads`/`writes`
  as links to `Document`s.
- `Activity` (abstract Step, so inline single-use authoring works):
  `performer?`, `inputs`/`outputs` as DocumentType links. `Task`
  extends it; `Process` extends it with `steps: Step[]` (an implicit
  sequence) and `documents: Document[]`. `Process` is a name scope
  (inline names and occurrence names are per process).
- `Document`: `documentType` link.
- Declared constraints (two regimes): invocation names an activity;
  read/write documents' types are among the called definition's
  declared input/output types; a Choice has at least one branch and
  at most one guardless branch; a Loop has a guard; a Document has a
  type.

## Ripple (stage A)

- `workflow-to-bpmn` reworked: implicit sequences; Choice flattens to
  an exclusive gateway pair with guards on the outgoing flows (the
  else flow unguarded); Loop flattens to a converging entry gateway
  and a diverging exit gateway with the guarded back edge (kind
  decides whether the test precedes the body); an inline Process step
  flattens as an embedded BPMN sub-process; an Invocation of a
  Process expands the same way in stage A (CallActivity arrives with
  the Descriptive subclass in B); an Invocation of a Task becomes a
  task named by the occurrence. Documents and performers are NOT
  flattened in stage A (data objects and lanes are stage B).
- `workflow-to-mermaid` reworked: `(choice)` subgraphs with
  guard-labeled branch subgraphs, `(loop while g)`/`(loop until g)`
  labels, process invocations as Mermaid subroutine shapes
  (`id[["name"]]`), tasks as boxes. Documents are not drawn in stage
  A (recorded as a candidate).
- `bpmn-to-mermaid` untouched except what its verification exercises.
- Samples reworked to the new authoring (approval,
  reviewed-approval, templated-approval) plus one richer sample
  exercising choice, loop, a twice-invoked shared definition, and
  document bindings; verifications extended accordingly.
- Docs: the suite page's metamodel and rules sections, the guides'
  workflow fragments, catalogs, READMEs, CHANGELOG.
- CLI: `--param` with provenance and tests.

## The org example (stage A)

`org-metamodel`: Worker (role?, worksIn), OrgUnit (parent, subUnits,
members), Department (manager), Board, Organization (topUnit), the
two inverses, ported to the current API. The sample sets Department
managers EXPLICITLY (the paper's Listing 9 leaves `manager` unbound
though the type requires it; flagged for the camera-ready).
`org-to-approval`: the Listing 10 transformation on the current API
(createExprNode, ExprNode, 4-generic abstractM2M; param
`{ worker: string; sensitivity: number }` with the worker resolved by
name, since a CLI parameter cannot carry an element reference;
flagged for the camera-ready). Target is the NEW workflow metamodel.
The verification runs two parameters (Judy at sensitivity 2: manager
approvals only; sensitivity 3: the board parallel appears), asserts
the generated process, the recorded param provenance, and the
onward chain to BPMN and both diagram views: the paper's figures.

## Stage B (recorded, not in scope now)

BPMN to the Descriptive conformance subclass: the element taxonomy,
`gatewayDirection` as a declared attribute with the flow-agreement
constraint (mixed gateways disallowed, per Method-and-Style),
CallActivity for invocations, DataObject/ItemDefinition for
Document/DocumentType with associations, lanes fed by performer, and
the renderer following.

## Execution

Stage A splits across parallel branches with disjoint files, each on
the ladder, merged --no-ff in dependency order: A1 the metamodel
reshape with transformations, samples, verifications (worktree
Synthesis-wt-history, branch feat/workflow-metamodel-v2); A2 the CLI
`--param` with provenance and tests (worktree Synthesis-wt-param,
branch feat/run-param); A3 the org example (after A1+A2); A4 the
docs pass (after all). No push.

## Status

Drafted 2026-09-07 from the user's decisions; committed as stage 0.
