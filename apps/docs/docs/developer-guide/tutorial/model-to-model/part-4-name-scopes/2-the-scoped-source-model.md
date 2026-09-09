---
sidebar_position: 2
---

# 2. The scoped source model

Here is Part 1's Library schema, rewritten in the scoped naming world.
Read it next to Part 1's sample and the difference is exactly the
names:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/name-scopes'
import type * as em from 'eer-tutorial-metamodel/name-scopes/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-tutorial-metamodel/name-scopes',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema for tutorial Part 4: the Library of Part 1 with natural names under entity scopes'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<em.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Domain name="number" />
    <Domain name="string" />
    <Entity name="Book">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="title" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Author">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Category">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    {/* 1:N: a book has at most one author. The mapping puts a foreign
        key on the N side, exactly as in Part 1. */}
    <Relationship name="writtenBy">
      <Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
    {/* M:N: books carry any number of categories and vice versa, mapped
        with a join table, exactly as in Part 1. */}
    <Relationship name="categorizedAs">
      <Role name="Categorized" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
      <Role name="Categorizes" lb="0" ub="M" domain={<Entity $refByName="Category"></Entity>} />
    </Relationship>
  </EERSchema>
)
```

## What to notice

**All three keys are `id`, and two entities carry a `name`.** This is
the model the flat rule forbade. Each entity is a scope, so the full
paths are `//Library/Book/id`, `//Library/Author/id`,
`//Library/Category/id`: three distinct elements with the same short
name. Note that `Author`'s attribute `name` and the `name` *property*
every element has are different things entirely; one is a model
element, the other is metadata on elements.

**The domain vocabulary moved to the model level.** Part 1's sample
declared `<Domain name="number" />` inline inside the first attribute
that needed it, and referenced it from everywhere else, which worked
because all names lived in one pool anyway. In the scoped world an
element declared inside an entity would live *in that entity's scope*,
so vocabulary that the whole model shares is declared once at the top,
in the model's own scope. This is the pattern scoped models push you
toward, and it is the better layout regardless: shared vocabulary,
declared at the level that shares it.

**The bare domain references still work.** Inside `Author`,
`$refByName="number"` first probes `Author`'s own scope and misses,
then probes outward to the model scope and finds the model-level
`number`. Outward probing is what keeps bare references convenient
exactly when the target is global vocabulary. Only references into a
*sibling* scope need a path, and this model has none: entities
reference domains (outward) and roles reference entities (already at
model level). The path form appears on the target side, where foreign
keys cross between tables, and that is the next page's story.

**The relationships are unchanged.** Same roles, same cardinalities,
same shapes as Part 1.

## Import it

The loop is Part 1's, with the new names:

```bash
synth model import sample/library.tsx --as demo/library
```

```text
Imported demo/library
```

The import gate validates against the scoped metamodel, so the three
`id` attributes pass. Reorder the model so that an entity declares two
attributes with the same name and the familiar duplicate-name error
returns, now scoped to the entity: uniqueness did not disappear, it
moved to where a modeler expects it.
