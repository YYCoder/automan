import { ObjectType } from "../../types/utils";
import { relative, sep } from "path";

export const jsonstringify = (obj: ObjectType) => JSON.stringify(obj, null, '...');

/**
 * e.g.
 *  1. relativeRoot('/a/b', '/a/b/c.txt') => 'c.txt'
 *  2. relativeRoot('/a/b', '/a/b/c/d.txt') => 'c'
 *  3. relativeRoot('/a/c', '/a/b/c.txt') => '..'
 */
export const relativeRoot = (from: string, to: string) => {
    return relative(from, to).split(sep)?.[0] ?? '';
};