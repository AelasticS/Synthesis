import * as e from "./EER-name-scopes.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<e.IEERSchema> & {
    store?: IStore;
};
export declare const EERSchema: CpxTemplate<IModelProps, e.IEERSchema>;
export declare const Entity: Template<e.IEntity>;
export declare const Attribute: Template<e.IAttribute>;
export declare const Domain: Template<e.IDomain>;
export declare const Relationship: Template<e.IRelationship>;
export declare const Role: Template<e.IOrdinaryMapping>;
