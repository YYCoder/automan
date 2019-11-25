import { 
    isLiteralType, isInCodeUnitType, isCodeUnit, isLiterals,
    buildNodeFromCodeUnit, buildNodesFromArray, buildNodeFromObject,
    buildProperty, buildArrayNodeFromArray
} from '../../src/utils/ast';
import { builders as b } from 'ast-types';
import { ASTBuildError } from '../../src/Errors';

describe('utils/ast', () => {
    describe('isLiteralType', () => {
        it('valid LiteralType', () => {
            expect(isLiteralType('string')).toBe(true);
            expect(isLiteralType('number')).toBe(true);
            expect(isLiteralType('null')).toBe(true);
            expect(isLiteralType('boolean')).toBe(true);
        });
        
        it('invalid types', () => {
            expect(isLiteralType('undefined')).toBe(false);
            expect(isLiteralType('object')).toBe(false);
            expect(isLiteralType('array')).toBe(false);
            expect(isLiteralType('function')).toBe(false);
        });
    });

    describe('isInCodeUnitType', () => {
        it('valid CodeUnitType', () => {
            expect(isInCodeUnitType('string')).toBe(true);
            expect(isInCodeUnitType('number')).toBe(true);
            expect(isInCodeUnitType('boolean')).toBe(true);
            expect(isInCodeUnitType('null')).toBe(true);
            expect(isInCodeUnitType('var')).toBe(true);
            expect(isInCodeUnitType('obj')).toBe(true);
            expect(isInCodeUnitType('arr')).toBe(true);
            expect(isInCodeUnitType('undefined')).toBe(true);
        });

        it('invalid CodeUnitType', () => {
            expect(isInCodeUnitType('object')).toBe(false);
            expect(isInCodeUnitType('array')).toBe(false);
            expect(isInCodeUnitType('function')).toBe(false);
        });
    });

    describe('isCodeUnit', () => {
        it('valid CodeUnit', () => {
            expect(isCodeUnit({ __type__: 'string', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'number', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'boolean', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'null', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'obj', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'arr', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'undefined', value: '234' })).toBe(true);
            expect(isCodeUnit({ __type__: 'var', value: '234' })).toBe(true);
        });

        it('plain object', () => {
            expect(isCodeUnit({})).toBe(false);
        });

        it('without value field', () => {
            expect(isCodeUnit({ __type__: 'string' })).toBe(false);
        });
        
        it('without __type__ field', () => {
            expect(isCodeUnit({ value: 'string' })).toBe(false);
        });
        
        it('array', () => {
            expect(isCodeUnit([])).toBe(false);
        });
    });

    describe('isLiterals', () => {
        it('valid literals', () => {
            expect(isLiterals('')).toBe(true);
            expect(isLiterals(0)).toBe(true);
            expect(isLiterals(null)).toBe(true);
            expect(isLiterals(false)).toBe(true);
        });

        it('undefined', () => {
            expect(isLiterals(undefined)).toBe(false);
        });
        
        it('object', () => {
            expect(isLiterals({})).toBe(false);
        });
        
        it('array', () => {
            expect(isLiterals([])).toBe(false);
        });
    });

    describe('buildNodeFromCodeUnit', () => {
        it('string', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'string',
                value: '123'
            })).toStrictEqual(b.literal(String('123')));
        });
        
        it('number', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'number',
                value: 123
            })).toStrictEqual(b.literal(Number('123')));
        });
        
        it('boolean', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'boolean',
                value: false
            })).toStrictEqual(b.literal(false));
        });
        
        it('null', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'null',
                value: null
            })).toStrictEqual(b.literal(null));
        });
        
        it('var', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'var',
                value: 'ha'
            })).toStrictEqual(b.identifier('ha'));
        });
        
        it('undefined', () => {
            expect(buildNodeFromCodeUnit({
                __type__: 'undefined',
                value: undefined
            })).toStrictEqual(b.identifier('undefined'));
        });
        
        it('invalid type', () => {
            expect(() => buildNodeFromCodeUnit({
                __type__: 'haha' as any,
                value: undefined
            })).toThrowError(ASTBuildError);
        });
    });

    describe('buildNodesFromArray', () => {
        it('empty array', () => {
            expect(buildNodesFromArray([])).toStrictEqual([]);
        });
        
        it('array with literal', () => {
            expect(buildNodesFromArray(['1', 1, false, null])).toStrictEqual([
                b.literal('1'),
                b.literal(1),
                b.literal(false),
                b.literal(null),
            ]);
        });

        it('array with CodeUnit', () => {
            expect(
                buildNodesFromArray([
                    {
                        __type__: 'string',
                        value: '123'
                    },
                    {
                        __type__: 'number',
                        value: 123
                    },
                    {
                        __type__: 'boolean',
                        value: false
                    },
                    {
                        __type__: 'null',
                        value: null
                    },
                    {
                        __type__: 'obj',
                        value: {
                            name: '123'
                        }
                    },
                    {
                        __type__: 'arr',
                        value: [123]
                    },
                ])
            ).toStrictEqual([
                b.literal('123'),
                b.literal(123),
                b.literal(false),
                b.literal(null),
                b.objectExpression([
                    b.property(
                        'init',
                        b.literal('name'),
                        b.literal('123')
                    )
                ]),
                b.arrayExpression([
                    b.literal(123),
                ])
            ]);
        });

        it('array with nested CodeUnit', () => {
            expect(
                buildNodesFromArray([
                    {
                        __type__: 'obj',
                        value: {
                            name: {
                                __type__: 'string',
                                value: '123'
                            }
                        }
                    },
                    {
                        __type__: 'arr',
                        value: [
                            {
                                __type__: 'number',
                                value: 123
                            }
                        ]
                    },
                ])
            ).toStrictEqual([
                b.objectExpression([
                    b.property(
                        'init',
                        b.literal('name'),
                        b.literal('123')
                    )
                ]),
                b.arrayExpression([
                    b.literal(123),
                ])
            ]);
        });

        it('array with object and array', () => {
            expect(buildNodesFromArray([
                {}, []
            ])).toStrictEqual([
                b.objectExpression([]),
                b.arrayExpression([])
            ]);

            expect(buildNodesFromArray([
                {
                    name: '123'
                },
                [123]
            ])).toStrictEqual([
                b.objectExpression([
                    b.property(
                        'init',
                        b.literal('name'),
                        b.literal('123')
                    )
                ]),
                b.arrayExpression([
                    b.literal(123),
                ])
            ]);
        });

        it('array with mixed CodeUnit and object', () => {
            expect(buildNodesFromArray([
                {
                    name: '123',
                    v: {
                        name: {
                            __type__: 'boolean',
                            value: false
                        }
                    }
                }
            ])).toStrictEqual([
                b.objectExpression([
                    b.property(
                        'init',
                        b.literal('name'),
                        b.literal('123')
                    ),
                    b.property(
                        'init',
                        b.literal('v'),
                        b.objectExpression([
                            b.property(
                                'init',
                                b.literal('name'),
                                b.literal(false)
                            )
                        ])
                    )
                ])
            ]);
        });

        it('array with wrong type', () => {
            expect(() => buildNodesFromArray([undefined] as any)).toThrowError(ASTBuildError);
        });
    });

    describe('buildNodeFromObject', () => {
        it('empty object', () => {
            expect(
                buildNodeFromObject({})
            ).toStrictEqual(
                b.objectExpression([])
            );
        });

        it('pass CodeUnit', () => {
            expect(
                buildNodeFromObject({
                    __type__: 'string',
                    value: 123
                })
            ).toStrictEqual(
                b.literal('123')
            );

            expect(
                buildNodeFromObject({
                    __type__: 'number',
                    value: 123
                })
            ).toStrictEqual(
                b.literal(123)
            );
            
            expect(
                buildNodeFromObject({
                    __type__: 'boolean',
                    value: false
                })
            ).toStrictEqual(
                b.literal(false)
            );

            expect(
                buildNodeFromObject({
                    __type__: 'obj',
                    value: {
                        name: '123'
                    }
                })
            ).toStrictEqual(
                b.objectExpression([
                    b.property('init', b.literal('name'), b.literal('123'))
                ])
            );
        });

        it('pass simple object', () => {
            expect(buildNodeFromObject({
                name: '123',
                value: false
            })).toStrictEqual(
                b.objectExpression([
                    b.property('init', b.literal('name'), b.literal('123')),
                    b.property('init', b.literal('value'), b.literal(false))
                ])
            );
        });

        it('pass object nested with CodeUnit', () => {
            expect(buildNodeFromObject({
                name: '123',
                obj: {
                    __type__: 'arr',
                    value: [123]
                }
            })).toStrictEqual(
                b.objectExpression([
                    b.property('init', b.literal('name'), b.literal('123')),
                    b.property(
                        'init',
                        b.literal('obj'),
                        b.arrayExpression([
                            b.literal(123)
                        ])
                    ),
                ])
            );
        });
    });

    describe('buildProperty', () => {
        it('basic usage', () => {
            expect(
                buildProperty('name', b.literal('123'))
            ).toStrictEqual(
                b.property('init', b.literal('name'), b.literal('123'))
            );
        });
    });

    describe('buildArrayNodeFromArray', () => {
        it('empty array', () => {
            expect(buildArrayNodeFromArray([])).toStrictEqual(b.arrayExpression([]));
        });

        it('array with literals', () => {
            expect(buildArrayNodeFromArray([123, '234', false, null]))
            .toStrictEqual(
                b.arrayExpression([
                    b.literal(123),
                    b.literal('234'),
                    b.literal(false),
                    b.literal(null),
                ])
            );
        });

        it('array with nested array', () => {
            expect(buildArrayNodeFromArray([[123]]))
            .toStrictEqual(
                b.arrayExpression([
                    b.arrayExpression([b.literal(123)])
                ])
            );
        });
    });

});