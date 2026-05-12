# Class: Filter

Defined in: [transducers/Filter.ts:15](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Filter.ts#L15)

Represents an interface for a processor.

## Implements

- [`IProcessor`](../interfaces/IProcessor.md)

## Constructors

### new Filter()

> **new Filter**(`xf`, `predicate`): [`Filter`](Filter.md)

Defined in: [transducers/Filter.ts:19](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Filter.ts#L19)

#### Parameters

##### xf

[`IProcessor`](../interfaces/IProcessor.md)

##### predicate

(`item`, `currNode`) => `boolean`

#### Returns

[`Filter`](Filter.md)

## Methods

### init()

> **init**(`value`, `currNode`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Filter.ts:24](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Filter.ts#L24)

Initializes the processor with a value.

#### Parameters

##### value

`any`

The initial value.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.

#### Implementation of

[`IProcessor`](../interfaces/IProcessor.md).[`init`](../interfaces/IProcessor.md#init)

***

### result()

> **result**(`result`, `currNode`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Filter.ts:28](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Filter.ts#L28)

Handles the result of a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.

#### Implementation of

[`IProcessor`](../interfaces/IProcessor.md).[`result`](../interfaces/IProcessor.md#result)

***

### step()

> **step**(`result`, `currNode`, `item`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Filter.ts:32](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Filter.ts#L32)

Performs a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

##### item

`any`

The item to process.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.

#### Implementation of

[`IProcessor`](../interfaces/IProcessor.md).[`step`](../interfaces/IProcessor.md#step)
