import { isEjsTemp, processEjs, containEjsTemp } from '../../src/utils/config';

describe('utils/config', () => {
    describe('isEjsTemp', () => {
        it('not string', () => {
            expect(isEjsTemp({} as any)).toBe(false);
            
            expect(isEjsTemp(null as any)).toBe(false);
            
            expect(isEjsTemp([] as any)).toBe(false);
            
            expect(isEjsTemp(234 as any)).toBe(false);
            
            expect(isEjsTemp(false as any)).toBe(false);
        });
        
        it('string without <%', () => {
            expect(isEjsTemp('124')).toBe(false);
            
            expect(isEjsTemp('< 123')).toBe(false);
        });

        it('string with <%', () => {
            expect(isEjsTemp('<% 123')).toBe(true);

            expect(isEjsTemp('<% 123 %>')).toBe(true);
        });
    });
    
    describe('processEjs', () => {
        it('ejs template string', () => {
            expect(processEjs('<%= arg %>', { arg: 123 })).toStrictEqual('123');
        });
        
        it('not ejs template string', () => {
            expect(processEjs('arg', { arg: 123 })).toStrictEqual('arg');
        });
        
        it('object with ejs template string', () => {
            expect(
                processEjs({
                    name: '<%= arg %>'
                }, { arg: 123 })
            ).toStrictEqual({
                name: '123'
            });
        });

        it('object without ejs template string', () => {
            expect(
                processEjs({
                    name: 'arg'
                }, { arg: 123 })
            ).toStrictEqual({
                name: 'arg'
            });
        });
        
        it('nested object with ejs template string', () => {
            expect(
                processEjs({
                    obj: {
                        name: '<%= arg %>'
                    }
                }, { arg: 123 })
            ).toStrictEqual({
                obj: {
                    name: '123'
                }
            });
        });
        
        it('nested object without ejs template string', () => {
            expect(
                processEjs({
                    obj: {
                        name: 'arg'
                    }
                }, { arg: 123 })
            ).toStrictEqual({
                obj: {
                    name: 'arg'
                }
            });
        });
        
        it('array with ejs template string', () => {
            expect(processEjs([124, '<%= arg %>'], { arg: 123 })).toStrictEqual([124, '123']);
        });
        
        it('array without ejs template string', () => {
            expect(processEjs([124, 'arg'], { arg: 123 })).toStrictEqual([124, 'arg']);
        });
        
        it('nested array with ejs template string', () => {
            expect(
                processEjs([124, ['<%= arg %>']], { arg: 123 })
            ).toStrictEqual([124, ['123']]);

            expect(
                processEjs([124, { name: '<%= arg %>' }], { arg: 123 })
            ).toStrictEqual([124, { name: '123' }]);
        });
        
        it('nested array without ejs template string', () => {
            expect(
                processEjs([124, ['arg']], { arg: 123 })
            ).toStrictEqual([124, ['arg']]);

            expect(
                processEjs([124, { name: 'arg' }], { arg: 123 })
            ).toStrictEqual([124, { name: 'arg' }]);
        });
    });
    
    describe('containEjsTemp', () => {
        it('ejs template string', () => {
            expect(containEjsTemp('<%= 123 %>')).toBe(true);
        });
        
        it('not ejs template string', () => {
            expect(containEjsTemp('hahaha')).toBe(false);
        });
        
        it('object with ejs template string', () => {
            expect(containEjsTemp({
                name: '<%= 234 %>'
            })).toBe(true);
        });
        
        it('object without ejs template string', () => {
            expect(containEjsTemp({
                name: 'hahaha'
            })).toBe(false);
        });
        
        it('nested object with ejs template string', () => {
            expect(containEjsTemp({
                obj: {
                    temp: '<% 123 %>'
                }
            })).toBe(true);
        });
        
        it('nested object without ejs template string', () => {
            expect(containEjsTemp({
                obj: {
                    temp: false
                }
            })).toBe(false);
        });
        
        it('array with ejs template string', () => {
            expect(containEjsTemp([124, '<%= 234 %>'])).toBe(true);
        });
        
        it('array without ejs template string', () => {
            expect(containEjsTemp([124, '234'])).toBe(false);
        });
        
        it('nested array with ejs template string', () => {
            expect(containEjsTemp([124, ['234', '<%= 234 %>']])).toBe(true);
            
            expect(containEjsTemp([124, { name: '<% 234 %>' }])).toBe(true);
        });
        
        it('nested array without ejs template string', () => {
            expect(containEjsTemp([124, ['234', false]])).toBe(false);
           
            expect(containEjsTemp([124, { name: '234' }])).toBe(false);
        });
    });
});