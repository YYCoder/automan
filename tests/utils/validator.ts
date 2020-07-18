import { validators, validatorFactory } from '../../src/utils/validator';

describe('utils/validator', () => {
    describe('validators', () => {
        describe('ascii', () => {
            const invalidMessage = 'you can only use ascii character';
            
            it('valid ascii string', () => {
                expect(validators.ascii('~{|}`_-?\\][/=+.,()')).toBe(true);
                
                expect(validators.ascii('1234567890')).toBe(true);
                
                expect(validators.ascii('qwertyuiopasdfghjklzxcvbnm')).toBe(true);
                
                expect(validators.ascii('QWERTYUIOPASDFGHJKLZXCVBNM')).toBe(true);
            });

            it('no valid ascii string', () => {
                expect(validators.ascii('哈哈')).toBe(invalidMessage);
                
                expect(validators.ascii('，')).toBe(invalidMessage);
            });
        });

        describe('path', () => {
            const invalidMessage = 'not a valid path';
            it('start with ./ or . or /', () => {
                expect(validators.path('.')).toBe(true);
                
                expect(validators.path('./')).toBe(true);
                
                expect(validators.path('./haha')).toBe(true);
                
                expect(validators.path('.haha')).toBe(true);
                
                expect(validators.path('/haha')).toBe(true);
            });

            it('normal path without extension', () => {
                expect(validators.path('foo/bar')).toBe(true);
                
                expect(validators.path('./foo/bar')).toBe(true);
            });

            it('path with extension would fail', () => {
                expect(validators.path('/foo/bar.ts')).toBe(invalidMessage);
            });
            
            it('with Chinese', () => {
                expect(validators.path('哈哈/bar')).toBe(invalidMessage);
            });
            
            it('empty is valid', () => {
                expect(validators.path('')).toBe(true);
            });
        });

        describe('number', () => {
            const invalidMessage = 'not a valid number';
            it('valid number', () => {
                expect(validators.number('123')).toBe(true);
            });
            
            it('with fractional part', () => {
                expect(validators.number('123.2')).toBe(true);
                
                expect(validators.number('.123.2')).toBe(true);
            });
            
            it('with english', () => {
                expect(validators.number('1haha23.2')).toBe(invalidMessage);
                
                expect(validators.number('123haha')).toBe(invalidMessage);
                
                expect(validators.number('haha123')).toBe(invalidMessage);
            });
        });

        describe('boolean', () => {
            const invalidMessage = 'not a valid boolean literal';
            it('valid boolean', () => {
                expect(validators.boolean('false')).toBe(true);
                
                expect(validators.boolean('true')).toBe(true);
            });
            
            it('many others', () => {
                expect(validators.boolean('123')).toBe(invalidMessage);
                
                expect(validators.boolean('0')).toBe(invalidMessage);
                
                expect(validators.boolean('{}')).toBe(invalidMessage);
            });
        });
    });
    
    describe('validatorFactory', () => {
        it('only one validator', () => {
            const validator = validatorFactory(['number']) as any;
            expect(validator('123')).toBe(true);
            
            expect(validator('asc')).toBe('not a valid number');
        });
        
        it('two validators', () => {
            const validator = validatorFactory(['path', 'ascii']) as any;
            expect(validator('./')).toBe(true);
            
            expect(validator('foo/bar')).toBe(true);
            
            expect(validator('哈哈/bar')).toBe('not a valid path');
        });
    });
});