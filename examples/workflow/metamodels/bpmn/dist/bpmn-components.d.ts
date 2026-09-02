import * as b from "./bpmn.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<b.IProcess> & {
    store?: IStore;
};
export declare const Process: CpxTemplate<IModelProps, b.IProcess>;
export declare const Task: Template<b.ITask>;
export declare const StartEvent: Template<b.IStartEvent>;
export declare const EndEvent: Template<b.IEndEvent>;
export declare const Gateway: Template<b.IGateway>;
export declare const SubProcess: Template<b.ISubProcess>;
export declare const Flow: Template<b.IFlow>;
