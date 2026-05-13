# Type Alias: Reducer()\<A\>

> **Reducer**\<`A`\>: (`result`, `currNode`, `item`) => `A`

Defined in: [transducers/Processor.ts:68](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L68)

Represents a reducer function type used to aggregate or accumulate values.

## Type Parameters

• **A**

The type of the accumulator/result.

## Parameters

### result

`A`

The accumulated result so far.

### currNode

[`Node`](../../../classes/Node.md)

The current element being processed in the reducer.

### item

`any`

Additional data or context that might be used in the reduction process.

## Returns

`A`

The updated accumulated result after processing the current element.
