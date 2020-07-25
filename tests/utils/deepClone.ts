import deepClone from '../../src/utils/deepClone';

describe('utils/deepClone', () => {
    const obj: any = { a: 123, b: { a: 234, c: [1,3,5] } };
    it('basic', () => {
        const res = deepClone(obj);
        expect(res).toStrictEqual(obj);
        expect(res).not.toBe(obj);
    });
    it('circular reference', () => {
        const obj1 = {
            name: 234,
            obj: obj
        };
        obj.obj1 = obj1;
        const res = deepClone(obj);
        expect(res).toStrictEqual(obj);
        expect(res).not.toBe(obj);
    });
});