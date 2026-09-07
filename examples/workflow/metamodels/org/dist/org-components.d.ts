import * as o from "./org.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<o.IOrganization> & {
    store?: IStore;
};
export declare const Organization: CpxTemplate<IModelProps, o.IOrganization>;
export declare const OrgUnit: Template<o.IOrgUnit>;
export declare const Department: Template<o.IDepartment>;
export declare const Board: Template<o.IBoard>;
export declare const Worker: Template<o.IWorker>;
export declare const Manager: Template<o.IWorker>;
export declare const TopUnit: Template<o.IOrgUnit>;
