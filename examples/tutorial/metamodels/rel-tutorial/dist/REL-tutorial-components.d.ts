import * as r from "./REL-tutorial.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<r.IRelSchema> & {
    store?: IStore;
};
export declare const RelSchema: CpxTemplate<IModelProps, r.IRelSchema>;
export declare const Table: Template<r.ITable>;
export declare const Column: Template<r.IColumn>;
