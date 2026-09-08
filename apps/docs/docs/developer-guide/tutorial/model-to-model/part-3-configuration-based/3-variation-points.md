---
sidebar_position: 3
---

# 3. Variation points

The design space is declared and bound. This page is the other half:
the rule that stops answering the question, and the manifest entry that
makes the package configuration-based.

Every listing is from [`examples/tutorial/eer-tutorial-configuration-based`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-configuration-based).

## The class becomes decision-aware

A transformation that reads a configuration extends a different base
class and takes one more constructor argument:

```tsx
@M2M()
export class EER2RelConfigurableTransformation extends DecisionAwareM2M<
  em.IEERSchema,
  rmT.IRelSchema,
  {},
  cm.IConfigurationModel
> {
  // A configuration-based transformation takes the run's configuration
  // model as a third argument. It is optional: without one, every
  // variation point falls back to its @Default option.
  constructor(store: ModelStore, {}, configModel?: cm.IConfigurationModel) {
    super(store, {}, configModel)
  }
```

`DecisionAwareM2M` takes four type parameters where `abstractM2M` took
two: the source model type, the target model type, a slot for extra
arguments (empty here), and the configuration model type. `@M2M()` is
the class decorator marking a model-to-model transformation.

The `configModel` argument is optional, and that is not a convenience.
It is what lets the same class run under generated defaults, where
there is no configuration model at all, and page 4's default run takes
exactly that path.

The imports the new machinery needs:

```tsx
import { E2E, SpecPoint, SpecOption, M2M } from '@aelastics/synthesis/m2m'
import { DecisionAwareM2M, VarPoint, VarOption, Default, Option } from '@aelastics/synthesis/variability'
import * as cm from '@aelastics/synthesis/metamodels/configuration/model'
```

Note the `Option` in that second line. It is not the `<Option />` tag
page 1 used to declare options in the decision model; that one comes
from the decision metamodel's components module. This one is a
predicate builder, and the two never appear in the same file.

## Before

Part 2's relationship rules, complete. One conditional and two plain
methods:

```tsx
  // Unchanged from Part 1: one conditional still decides the mapping.
  // Relationship variants are a design choice, not a subtype of the
  // source element, so specialization cannot express them. Part 3 turns
  // this into a configuration-based rule.
  relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const [role1, role2] = rel.roles
    if (role1.ub === 'M' && role2.ub === 'M') {
      return this.relationshipAsJoinTable(rel)
    }
    return this.relationshipAsForeignKey(rel)
  }

  relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
    const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={`${fkSide.domain.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain)}
          isKey={false}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(fkSide.domain).name} />}
        />
      </Table>
    )
  }
```

`relationshipAsForeignKey` is a good method. There is nothing wrong
with it except that nothing outside the class can ask for the other
one.

## After

The same logic, with the open half handed over:

```tsx
  // The line between fixed logic and an open decision. An M:N
  // relationship cannot be carried by a foreign key column on either
  // side, so the join table is structurally forced and the branch stays
  // plain code. Everything else reaching this rule is 1:N, and there the
  // structure is a design choice, so the rule hands over to a variation
  // point.
  relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const [role1, role2] = rel.roles
    if (role1.ub === 'M' && role2.ub === 'M') {
      return this.relationshipAsJoinTable(rel)
    }
    return this.oneToManyMapping(rel)
  }

  // The variation point. Its body is never executed: the engine looks up
  // the option selected for this relationship in the run's configuration
  // model and calls that method instead. @E2E is outermost so the trace
  // records which option was taken; @VarPoint must be inner so it
  // registers its options bucket before the @VarOption decorators run.
  @E2E()
  @VarPoint('OneToManyStrategy')
  oneToManyMapping(rel: em.IRelationship): ExprNode<rmT.ITable> {
    throw new Error('No option selected for the OneToManyStrategy variation point')
  }

  // The default option, matching isDefault on ForeignKey in the decision
  // model: the N side gains a foreign key column pointing at the 1 side.
  @Default()
  @VarOption('oneToManyMapping', Option('ForeignKey'))
  oneToManyAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
    const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={`${fkSide.domain.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain)}
          isKey={false}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(fkSide.domain).name} />}
        />
      </Table>
    )
  }

  // The alternative option: the same join table an M:N relationship gets.
  // A 1:N relationship in a table of its own costs a join on every read
  // but keeps the N side free of the reference, which is what makes this
  // a design decision rather than a derivable fact.
  @VarOption('oneToManyMapping', Option('JoinTable'))
  oneToManyAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return this.relationshipAsJoinTable(rel)
  }
```

Three things happened, and they are worth separating.

**The conditional survived, halved.** Its M:N branch is untouched and
still calls `relationshipAsJoinTable` directly. Only the fall-through
changed target, from a method that decided to a method that asks.

**`relationshipAsForeignKey` was renamed, not rewritten.** Its body is
Part 2's, character for character. It became an option by acquiring two
decorators.

**A method with no body was added.** `oneToManyMapping` throws, and
that is its whole implementation, because the engine replaces the call
rather than delegating to it. The `throw` is a guard against a
misconfigured class, not a code path anyone should reach: the message
you would see is the one you wrote.

## The three decorators

**`@VarPoint(issue)`** marks a rule as a variation point and names the
issue from the decision model that it resolves. When the rule is
called, the engine collects the choices recorded for the current source
element, picks an option, and calls that option's method with the same
arguments.

**`@VarOption(pointMethod, predicate)`** registers a method as one
answer at the named point. The first argument is the point method's
name as a string; the second is the predicate that selects it.
`Option('ForeignKey')` is true when a choice for the current element
selects the option named `ForeignKey`, which is where page 1's decision
model and this file meet. The predicates compose with `And`, `Or` and
`Not` when a rule needs more than one issue to agree, though this
package does not.

**`@Default()`** marks one option as the fallback. Selection tries the
non-default options first, in declaration order, and takes the first
whose predicate holds; if none does, the option marked `@Default()`
runs. That is what makes the missing-configuration case work: with no
configuration model there are no choices, no predicate can hold, and
`oneToManyAsForeignKey` runs.

Without a default, a point that finds no match fails the run:

```text
No option condition evaluated to true and no default option provided
```

Options are reachable only through their point. Nothing in the class
calls `oneToManyAsForeignKey` or `oneToManyAsJoinTable` by name, and
nothing should: routing every answer through the point is what makes
the configuration the single account of which answer was taken.

That is also why `relationshipAsJoinTable` stayed a plain method rather
than becoming an option. Both the forced M:N branch and the chosen
`JoinTable` option need the same structure, and a shared helper is the
honest way to say so:

```tsx
  // Fixed logic, shared by the M:N branch and the JoinTable option.
  // Column names are qualified by the relationship, the way the weak
  // entity rule qualifies its owner key with the entity name. Once 1:N
  // relationships may become join tables too, one schema can hold two
  // join tables that both reference Book, and column names are unique
  // per schema.
  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return (
      <Table name={rel.name}>
        {rel.roles.map((role) => (
          <Column
            name={`${rel.name}_${role.domain.name}Id_FK`}
            type={this.columnType(this.keyAttributeOf(role.domain).attrDomain)}
            isKey={false}
            isNullable={false}
            isAutoincrement={false}
            references={<Column $refByName={this.keyAttributeOf(role.domain).name} />}
          />
        ))}
      </Table>
    )
  }
```

The one substantive change is in the column name. Part 2 wrote
`` `${role.domain.name}Id_FK` ``, producing `BookId_FK`. Part 3 writes
`` `${rel.name}_${role.domain.name}Id_FK` ``, producing
`writtenBy_BookId_FK`. The reason is the same one Part 1 gave for
qualifying foreign key names and Part 2 gave for `BookCopy_BookId_FK`:
element names are unique across a whole model. As long as only M:N
relationships became join tables, a collision was unlikely. Once a 1:N
relationship may become one too, a schema can easily hold two join
tables both referencing `Book`, and the unqualified name would fail the
run. Keep it in mind when reading page 4's output, where every join
table column carries its relationship's name.

## Decorator order, again

Part 2 established that `@E2E()` goes outside `@SpecPoint()`. The same
rule holds for `@VarPoint()`, for the same reason and with the same
enforcement at load time:

```text
@VarPoint on "oneToManyMapping" cannot be combined with @E2E.
Valid: @VarPoint alone, or @E2E above @VarPoint.
```

`@E2E` outermost sees the result the dispatch actually produced, and
records which option was selected alongside the choices that selected
it. Inverted, it would trace a rule that only ever throws.

`@Default()` has a placement rule of its own: it goes directly above
`@VarOption()`, never below and never anywhere else.

```text
@Default on "oneToManyAsForeignKey" requires @VarOption below it.
  Correct order:
    @Default()
    @VarOption("method", condition)
    oneToManyAsForeignKey(...) { ... }
```

## Both mechanisms, one class

This class now has a specialization point and a variation point in it,
and they coexist without interacting:

| | `@SpecPoint` / `@SpecOption` | `@VarPoint` / `@VarOption` |
| --- | --- | --- |
| Dispatches on | The source element's runtime type | The configuration's choice for that element |
| Decided by | The person who wrote the model | The person who runs the transformation |
| Base rule body | Runs, and merges with the option | Never runs |
| Nothing matches | The run fails | The `@Default()` option runs, and the run fails only if there is none |

The one hard constraint is that they must sit on **different methods**.
A rule is either dispatched by type or resolved by configuration, and
the guards reject a method carrying both:

```text
@SpecPoint on "entityToTable" cannot be combined with @VarPoint.
Valid: @SpecPoint alone, or @E2E above @SpecPoint.
```

If a rule genuinely needs both, the answer is to compose them: let the
specialization option call a variation point, or the other way round,
so each decorator stays on the method whose question it answers.

## The manifest

The last change is `synth.json`. Everything Part 2 had is unchanged,
and a `parts` block is added:

```json
{
  "kind": "m2m",
  "entry": "./dist/transformation.js",
  "exportName": "EER2RelConfigurableTransformation",
  "source": {
    "metamodel": "eer-tutorial-metamodel/advanced"
  },
  "target": {
    "metamodel": "rel-tutorial-metamodel",
    "components": "rel-tutorial-metamodel"
  },
  "parts": {
    "metamodels": [
      {
        "module": "eer-tutorial-metamodel/advanced/as-model",
        "exportName": "EERTutorialMetamodel"
      }
    ],
    "decisionModel": {
      "module": "./dist/decision-model.js",
      "exportName": "RelationshipDesignIssues"
    },
    "bindingModel": {
      "module": "./dist/binding-model.js",
      "exportName": "EERTutorialBindings"
    }
  }
}
```

Each entry has the same two fields as the top-level entry point: a
`module` and the `exportName` inside it. The `module` comes in two
shapes. The decision model and the binding model are the
transformation's own files, so their entries are package-relative
paths into `dist`, and a change to either source file needs a rebuild
before it takes effect. The metamodel-as-model belongs to the
metamodel package, so its entry is the package's `as-model` subpath, a
bare specifier resolved exactly like the imports in the code.

**Order matters, and it is the order written above.** The parts are
rendered into the store before every run: metamodels first, then the
decision model, then the binding model. That is the order their
references run in. The binding model points at the metamodel model and
at the decision model, so both have to exist by the time it renders.
Page 2's absolute paths work for exactly this reason.

**The decision model and the binding model go together.** Declaring one
without the other leaves the design space either unattached or pointing
at nothing.

**Their presence is the whole declaration.** Part 1's page 5 noted that
nothing in the manifest says a transformation is configuration-based,
and this is what it meant: a `parts` block with a decision model and a
binding model in it *is* the statement. Page 4 shows the CLI reporting
it back as `variability: yes`, and it shows what that changes about how
a run behaves.

## Further reading

The [design decisions guide](../../../guides/variability.md) covers the
predicate language in full, including `And`, `Or` and `Not`, and states
the guarantees the mechanism provides.

## Next

The code is finished. [Running with configurations](./4-running-with-configurations.md)
installs it, runs it both ways, and reads the two schemas.
