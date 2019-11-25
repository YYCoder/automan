import { isString, isObject, isArray } from "./typeGuards";
import ejs from "ejs";

export const isEjsTemp = (str: string): boolean => isString(str) && str.includes('<%');

/**
 * recursively determine if arg has a ejs template string in it, use for process config 
 * containing ejs template.
 */
export const containEjsTemp = (arg: any): boolean => {
    if (isEjsTemp(arg)) return true;
    if (isObject(arg)) {
        let res = false;
        for (const key in arg) {
            if (isObject(arg[key]) || isArray(arg[key])) {
                if (containEjsTemp(arg[key])) return true;
            }
            if (isEjsTemp(arg[key])) return true;
        }
        return res;
    }
    if (isArray(arg)) {
        return arg.some(a => isObject(a) || isArray(a) ?
            containEjsTemp(a) :
            isEjsTemp(a));
    }
    return false;
};

/**
 * process argument containing ejs template with data, recursive process if 
 * argument is an object or array.
 * currently, it will process every argument containing ejs template.
 */
export const processEjs = (arg: any, data: any): any => {
    if (isString(arg)) return ejs.render(arg, data);
    if (isObject(arg)) {
        for (const key in arg) {
            const value = arg[key];
            if (isEjsTemp(value)) {
                arg[key] = ejs.render(value, data);
            }
            else if ((isArray(value) || isObject(value)) && containEjsTemp(value)) {
                arg[key] = processEjs(value, data);
            }
        }
        return arg;
    }
    if (isArray(arg)) {
        return arg.map(a => {
            if (isEjsTemp(a)) {
                return ejs.render(a, data);
            }
            else if ((isArray(a) || isObject(a)) && containEjsTemp(a)) {
                return processEjs(a, data);
            }
            return a;
        });
    }
    return arg;
};