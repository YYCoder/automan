import { CodeUnitType } from "../src/utils/ast";

export type ObjectType = { [key: string]: any };

export type LiteralTypes = string | number | boolean | null;

export type LiteralObject = { [key: string]: LiteralTypes };

export type LiteralArray = LiteralTypes[];

export type AutomanConfigUnit = LiteralTypes | ObjectType | Array<any> | CodeUnitType;

export type CodeUnitObject = { [key: string]: AutomanConfigUnit };

export type CodeUnitArray = AutomanConfigUnit[];
