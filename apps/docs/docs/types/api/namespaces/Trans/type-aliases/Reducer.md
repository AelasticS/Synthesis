# Type Alias: Reducer()\<A\>

> **Reducer**\<`A`\>: (`result`, `currNode`, `item`) => `A`

Defined in: [transducers/Processor.ts:68](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Processor.ts#L68)

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
