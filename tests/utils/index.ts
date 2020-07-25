import { relativeRoot } from '../../src/utils';

describe('utils/index', () => {
    describe('relativeRoot', () => {
        it(`relativeRoot('/a/b', '/a/b/c.txt') => 'c.txt'`, () => {
            expect(relativeRoot('/a/b', '/a/b/c.txt')).toBe('c.txt');
        });
        
        it(`relativeRoot('/a/b', '/a/b/c/d.txt')`, () => {
            expect(relativeRoot('/a/b', '/a/b/c/d.txt')).toBe('c');
        });
        
        it(`relativeRoot('/a/c', '/a/b/c.txt')`, () => {
            expect(relativeRoot('/a/c', '/a/b/c.txt')).toBe('..');
        });
    });
});
