import * as w from "./workflow.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<w.IProcess> & {
    store?: IStore;
};
export declare const Process: CpxTemplate<IModelProps, w.IProcess>;
export declare const Task: Template<w.ITask>;
export declare const Sequence: Template<w.ISequence>;
export declare const Parallel: Template<w.IParallel>;
export declare const SubProcess: Template<w.ISubProcess>;
