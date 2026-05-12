# Class: AddEventListeners

Defined in: [eventLog/AddEventListenersTransformer.ts:21](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/eventLog/AddEventListenersTransformer.ts#L21)

## Implements

- `IProcessor`

## Constructors

### new AddEventListeners()

> **new AddEventListeners**(`xf`, `eventLog`): [`AddEventListeners`](AddEventListeners.md)

Defined in: [eventLog/AddEventListenersTransformer.ts:25](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/eventLog/AddEventListenersTransformer.ts#L25)

#### Parameters

##### xf

`IProcessor`

##### eventLog

`EventLog`

#### Returns

[`AddEventListeners`](AddEventListeners.md)

## Methods

### init()

> **init**(`value`, `currNode`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/AddEventListenersTransformer.ts:38](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/eventLog/AddEventListenersTransformer.ts#L38)

Initializes the processor with a value.

#### Parameters

##### value

`any`

The initial value.

##### currNode

`Node`

The current node.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.init`

***

### result()

> **result**(`result`, `currNode`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/AddEventListenersTransformer.ts:42](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/eventLog/AddEventListenersTransformer.ts#L42)

Handles the result of a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

`Node`

The current node.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.result`

***

### step()

> **step**(`result`, `currNode`, `item`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/AddEventListenersTransformer.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/eventLog/AddEventListenersTransformer.ts#L56)

Performs a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

`Node`

The current node.

##### item

`any`

The item to process.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.step`
