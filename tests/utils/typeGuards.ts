import { isString, isObject, isArray, isTemplateObj } from '../../src/utils/typeGuards';

describe('utils/typeGuards', () => {
    describe('isString', () => {
        it('string', () => {
            expect(isString('123')).toBe(true);
        });
        
        it('not string', () => {
            expect(isString(123)).toBe(false);
        });
    });

    describe('isObject', () => {
        it('object', () => {
            expect(isObject({})).toBe(true);
        });
        
        it('array', () => {
            expect(isObject([])).toBe(false);
        });
        
        it('string', () => {
            expect(isObject('123')).toBe(false);
        });
        
        it('null', () => {
            expect(isObject(null)).toBe(false);
        });
    });

    describe('isArray', () => {
        it('array', () => {
            expect(isArray([])).toBe(true);
        });
        
        it('object', () => {
            expect(isArray({})).toBe(false);
        });
        
        it('string', () => {
            expect(isArray('')).toBe(false);
        });
    });

    describe('isTemplateObj', () => {
        it('string', () => {
            expect(isTemplateObj('123')).toBe(false);
        });
        
        it('object, but not template object', () => {
            expect(isTemplateObj({})).toBe(false);
        });
        
        it('array', () => {
            expect(isTemplateObj([])).toBe(false);
        });
        
        it('template object', () => {
            expect(isTemplateObj({
                prop: '123123',
                value: {}
            })).toBe(true);
        });
        
        it('template object, but not valid', () => {
            expect(isTemplateObj({
                prop: '123123',
                value: ''
            })).toBe(false);
        });
    });
});