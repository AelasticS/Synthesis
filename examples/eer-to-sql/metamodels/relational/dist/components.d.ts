import * as r from "./model.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<r.IRelSchema> & {
    store?: IStore;
};
export declare const RelSchema: CpxTemplate<IModelProps, r.IRelSchema>;
export declare const Domain: Template<r.IDomain>;
export declare const Column: Template<r.IColumn>;
export declare const Table: Template<r.ITable>;
