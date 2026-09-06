import * as r from "./REL.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<r.IRelSchema> & {
    store?: IStore;
};
export declare const RelSchema: CpxTemplate<IModelProps, r.IRelSchema>;
export declare const Domain: Template<r.IDomain>;
export declare const Column: Template<r.IColumn>;
export declare const Table: Template<r.ITable>;
export declare const ForeignKey: Template<r.IForeignKey>;
export declare const ForeignKeyColumn: Template<r.IForeignKeyColumn>;
export declare const Index: Template<r.IIndex>;
export declare const PrimaryKey: Template<r.IPrimaryKey>;
