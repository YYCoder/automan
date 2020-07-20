import AddCallChain from '../../src/transforms/AddCallChain';
import { AddCallChainRule } from '../../types';
import { parse } from 'recast';
import { toSource } from '../../src/utils/ast';

const baseRule: AddCallChainRule = {
    transformer: 'AddCallChain',
    func: 'fun',
    root: 'test',
    args: []
};
const getResCode = (rule: AddCallChainRule, originalCode: string) => {
    const originalAst = parse(
        originalCode,
        {
            parser: require("recast/parsers/typescript")
        }
    );
    const r: AddCallChainRule = Object.assign({
        transformer: 'AddCallChain',
        func: 'add',
        root: 'fun',
        args: [],
    }, rule);
    const t = new AddCallChain(r);
    
    return toSource(t.transform(originalAst));
};
describe('AddCallChain', () => {
    describe('initialization', () => {
        it('basic usage', () => {
            const rule: AddCallChainRule = {
                ...baseRule,
                args: []
            };
            const t = new AddCallChain(rule);
            expect(t.name).toBe('AddCallChain');
            expect(t.rule).toStrictEqual(rule);
        });
    });

    describe('preprocessRule', () => {
        it('validation', () => {
            expect(() => AddCallChain.preprocessRule(123 as any, {})).toThrowError();
        });

        it('without CodeUnit', () => {
            const rule: AddCallChainRule = {
                ...baseRule,
                args: [
                    123, '234', false, null
                ]
            };
            expect(AddCallChain.preprocessRule(rule, {})).toStrictEqual(rule);
        });
        
        it('with CodeUnit', () => {
            const rule: AddCallChainRule = {
                ...baseRule,
                args: [
                    "<%= `${arg1}${arg2}` %>",
                    {
                        __type__: "var",
                        value: "<%= `${arg1}${arg2}` %>"
                    },
                    {
                        __type__: "undefined",
                        value: "undefined"
                    },
                    {
                        __type__: "string",
                        value: "<%= `${arg1}-${arg2}` %>"
                    },
                    {
                        __type__: "obj",
                        value: {
                            "name": "hahaah",
                            "test": "<%= `${arg1}${arg2}` %>",
                            "other": {
                                __type__: "string",
                                value: "<%= arg1 %>"
                            }
                        }
                    },
                    {
                        __type__: "arr",
                        value: [
                            123,
                            {
                                __type__: "number",
                                value: "<%= arg2 %>"
                            },
                            {
                                __type__: "boolean",
                                value: "<%= arg1 %>"
                            }
                        ]
                    }
                ]
            };
            const data = { arg1: 'foo', arg2: 'bar' };
            const resRule = {
                ...baseRule,
                args: [
                    'foobar',
                    {
                        __type__: 'var',
                        value: 'foobar'
                    },
                    {
                        __type__: 'undefined',
                        value: 'undefined'
                    },
                    {
                        __type__: 'string',
                        value: 'foo-bar'
                    },
                    {
                        __type__: 'obj',
                        value: {
                            name: 'hahaah',
                            test: 'foobar',
                            other: {
                                __type__: 'string',
                                value: 'foo'
                            }
                        }
                    },
                    {
                        __type__: 'arr',
                        value: [
                            123,
                            {
                                __type__: 'number',
                                value: 'bar'
                            },
                            {
                                __type__: 'boolean',
                                value: 'foo'
                            }
                        ]
                    }
                ]
            };
            expect(AddCallChain.preprocessRule(rule, data)).toStrictEqual(resRule);
        });
    });
    
    describe('transform', () => {
        it('without arguments', () => {
            const originalCode = 'router.add(123);'
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'router',
                args: []
            }, originalCode);
            
            expect(resCode).toBe('router.add().add(123);');
        });

        it('with literal arguments', () => {
            const originalCode = 'router.add(123);'
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'router',
                args: [123, '234', null, false]
            }, originalCode);
            
            expect(resCode).toBe('router.add(123, \"234\", null, false).add(123);');
        });

        it('with CodeUnit arguments', () => {
            const originalCode = 'router.add(123);'
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'router',
                args: [
                    {
                        __type__: 'var',
                        value: 'foo'
                    }
                ]
            }, originalCode);
            
            expect(resCode).toBe('router.add(foo).add(123);')
        });

        it('root is function call', () => {
            const originalCode = 'fun().add(123);';
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'fun',
                args: []
            }, originalCode);
            
            expect(resCode).toBe('fun().add().add(123);');
        });

        it('root is object property', () => {
            const originalCode = 'obj.prop.add(123);';
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'prop',
                args: []
            }, originalCode);
            
            expect(resCode).toBe('obj.prop.add().add(123);');
        });
        
        it('root without no call, should not add method call', () => {
            const originalCode = 'obj;';
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'obj',
                args: []
            }, originalCode);
            
            expect(resCode).toBe('obj;');
        });

        it('root is nested in function', () => {
            const originalCode = 'function test() {\n'
                + 'root.add();\n'
                + '}';
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'root',
                args: []
            }, originalCode);
            const expectCode = 'function test() {\n'
            + '    root.add().add();\n'
            + '}';
            expect(resCode).toBe(expectCode);
        });

        it('root is nested in condition', () => {
            const originalCode = 'if (true) {\n'
                + 'root.add();\n'
                + '}';
            const resCode = getResCode({
                transformer: 'AddCallChain',
                func: 'add',
                root: 'root',
                args: []
            }, originalCode);
            const expectCode = 'if (true) {\n'
            + '    root.add().add();\n'
            + '}';
            expect(resCode).toBe(expectCode);
        });
    });
});