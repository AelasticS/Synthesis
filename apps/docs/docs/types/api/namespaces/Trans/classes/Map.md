# Class: Map

Defined in: [transducers/Map.ts:8](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Map.ts#L8)

Represents an interface for a processor.

## Implements

- [`IProcessor`](../interfaces/IProcessor.md)

## Constructors

### new Map()

> **new Map**(`xf`, `f`): [`Map`](Map.md)

Defined in: [transducers/Map.ts:12](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Map.ts#L12)

#### Parameters

##### xf

[`IProcessor`](../interfaces/IProcessor.md)

##### f

(`item`, `currNode`) => `any`

#### Returns

[`Map`](Map.md)

## Methods

### init()

> **init**(`value`, `currNode`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Map.ts:17](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Map.ts#L17)

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

Defined in: [transducers/Map.ts:21](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Map.ts#L21)

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

Defined in: [transducers/Map.ts:25](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Map.ts#L25)

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
