import * as r from './REL.meta.model.type.js';
import { ExprNode } from '@aelastics/synthesis/jsx';
export const RelSchema = (props) => {
    return new ExprNode(r.RelSchema, props, undefined);
};
export const Domain = (props) => {
    return new ExprNode(r.Domain, props, 'domain');
};
export const Column = (props) => {
    return new ExprNode(r.Column, props, 'columns');
};
export const ForeignKeyColumn = (props) => {
    return new ExprNode(r.ForeignKeyColumn, props, 'fkColumns');
};
export const Index = (props) => {
    return new ExprNode(r.Index, props, 'indexes');
};
export const ForeignKey = (props) => {
    return new ExprNode(r.ForeignKey, props, 'foreignKeys');
};
export const Table = (props) => {
    return new ExprNode(r.Table, props, undefined);
};
//# sourceMappingURL=REL-components.js.map