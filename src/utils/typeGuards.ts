import { GenerateTemplateObject } from "../../types";
import { ObjectType } from "../../types/utils";

export const isString = (arg: any): arg is string => typeof arg === 'string';

export const isObject = (arg: any): arg is ObjectType => 
    arg !== null && typeof arg === 'object' && !Array.isArray(arg);

export const isArray = Array.isArray;

export const isTemplateObj = (arg: any): arg is GenerateTemplateObject => {
    return isObject(arg) && isString(arg?.prop) && isObject(arg?.value);
};