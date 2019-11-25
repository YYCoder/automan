import Main from '../../src/Main';
import { Command } from 'commander';
import path from 'path';
import { QuestionTypeMap } from '../../types';
import { validatorFactory } from '../../src/utils/validator';

describe('Main', () => {
    describe('isQuestionAllAnswered', () => {
        it('empty questions', () => {
            const program = new Command();
            const m = new Main(program) as any;

            m._questions = [];
            m._answers = {
                data: {}
            };
            expect(m.isQuestionAllAnswered()).toBe(true);
        });
        
        it('remain question not answered', () => {
            const program = new Command();
            const m = new Main(program) as any;

            m._questions = [{ name: 'a', message: 'aMes' }, { name: 'b', message: 'bMes' }];
            m._answers = {
                data: {
                    a: 123
                }
            };
            expect(m.isQuestionAllAnswered()).toBe('bMes');
        });
    });

    describe('isAnswersTypeAllValid', () => {
        it('right type', () => {
            const program = new Command();
            const m = new Main(program) as any;

            m._questions = [{
                name: 'bool',
                validate: validatorFactory(['boolean'])
            }, {
                name: 'str',
                validate: validatorFactory(['ascii'])
            }, {
                name: 'num',
                validate: validatorFactory(['number'])
            }, {
                name: 'path',
                validate: validatorFactory(['path'])
            }];
            m._answers = {
                data: {
                    bool: 'true',
                    str: '234',
                    num: '234',
                    path: './mock',
                }
            };
            expect(m.isAnswersTypeAllValid()).toBe(true);
        });

        it('wrong type', () => {
            const program = new Command();
            const m = new Main(program) as any;

            m._questions = [{
                name: 'bool',
                validate: validatorFactory(['number'])
            }];
            m._answers = {
                data: {
                    bool: 'true'
                }
            };
            expect(m.isAnswersTypeAllValid()).toBe('bool');
        });
    });

    describe('getQuestions', () => {
        it('empty', () => {
            const config = require('./mock/empty.json');
            const program = new Command();
            const m = new Main(program) as any;

            m.getQuestions(config);
            
            expect(m._questions.length).toBe(0);
        });
        
        it('generate commom output', () => {
            const config = require('./mock/automan.json');
            const program = new Command();
            const m = new Main(program) as any;

            m.getQuestions(config);
            
            expect(m._questions.length).toBe(2);
            expect(m._questions.some((q: any) => q.name === 'commonOutput')).toBe(true);
        });

        it('generate rule output', () => {
            const config = require('./mock/generate-rule-output.json');
            const program = new Command();
            const m = new Main(program) as any;

            m.getQuestions(config);
            
            expect(m._questions.length).toBe(3);
            expect(m._questions.map((q: any) => q.name)).toStrictEqual(['name', 'output-0', 'output-1']);
        });
        
        it('modify rule', () => {
            const config = require('./mock/modify.json');
            const program = new Command();
            const m = new Main(program) as any;

            m.getQuestions(config);
            
            expect(m._questions.length).toBe(2);
            expect(m._questions.map((q: any) => q.name)).toStrictEqual(['arg1', 'arg2']);
        });

    });
    
    describe('generateInquirerOptions', () => {
        it('list', () => {
            const program = new Command();
            const m = new Main(program) as any;

            const name = 'foo';
            const description = 'bar';
            const type = 'list';
            const prompt = [
                {
                    "value": "class",
                    "name": "Class"
                },
                {
                    "value": "function",
                    "name": "Function"
                }
            ];
            expect(
                m.generateInquirerOptions({
                    name,
                    description,
                    type,
                    prompt,
                    validate: []
                })
            ).toStrictEqual({
                name,
                message: description,
                type: QuestionTypeMap[type],
                choices: prompt
            });
        });

        it('path', () => {
            const program = new Command();
            const m = new Main(program) as any;

            const name = 'foo';
            const description = 'bar';
            const type = 'path';
            expect(
                m.generateInquirerOptions({
                    name,
                    description,
                    type,
                    validate: []
                })
            ).toStrictEqual({
                name,
                message: description,
                type: QuestionTypeMap[type],
                source: m.getAutoCompletePath
            });
        });

        it('string | boolean | number', () => {
            const program = new Command();
            const m = new Main(program) as any;

            const name = 'foo';
            const description = 'bar';
            ['string', 'boolean', 'number'].forEach((t) => {
                expect(
                    m.generateInquirerOptions({
                        name,
                        description,
                        type: t,
                        validate: []
                    })
                ).toStrictEqual({
                    name,
                    message: description,
                    type: QuestionTypeMap[t as keyof typeof QuestionTypeMap]
                });
            });
        });
    });
    
    describe('resolveConfig', () => {
        it('relative path', () => {
            const program = new Command();
            const mockPath = './__tests__/Main/mock/automan.json';
            program.config = mockPath;
            const m = new Main(program) as any;
            expect(m.resolveConfig()).toStrictEqual([
                require(path.resolve(process.cwd(), mockPath)),
                path.resolve(process.cwd(), mockPath)
            ]);
        });
        
        it('absolute path', () => {
            const program = new Command();
            const mockPath = path.resolve(process.cwd(), './__tests__/Main/mock/automan.json');
            program.config = mockPath;
            const m = new Main(program) as any;
            expect(m.resolveConfig()).toStrictEqual([
                require(mockPath),
                mockPath
            ]);
        });
    });
});