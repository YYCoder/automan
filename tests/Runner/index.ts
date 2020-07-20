import Runner from '../../src/Runner';
import ConfigAnswers from '../../src/ConfigAnswers';
import { ConfigError } from '../../src/Errors';
import path from 'path';
import { resolveCwd, resolveDirname } from '../../src/utils';
import rimraf from 'rimraf';
import { readdirSync, writeFile, readFileSync } from 'fs';

const RunnerFactory = (props: string = '', confPath: string = './mock/initialization/automan.json') => {
    const config = require(confPath);
    return [
        new Runner(config, require.resolve(confPath), new ConfigAnswers(props)),
        config,
        confPath
    ];
};
const beforeGenerate = async (type: string) => {
    return new Promise((resolve) => {
        rimraf(
            resolveDirname(__dirname, `./mock/run/${type}/output/*`),
            resolve
        );
    });
};
const beforeModify = async (type: string) => {
    const originalCode = `const router: any = {};
    router.route.add("123", "haha", "xixi");`;
    return new Promise((resolve) => {
        writeFile(
            resolveDirname(__dirname, `./mock/run/${type}/template/code.ts`),
            originalCode,
            () => resolve()
        )
    });
};
describe('Runner', () => {
    describe('initialization', () => {
        it('basic usage', () => {
            const [r, config, confPath] = RunnerFactory();
    
            expect(r.name).toBe('mock');
            expect(r.description).toBe('initialization');
            expect(r.config).toStrictEqual(config);
            expect(r.configPath).toBe(require.resolve(confPath));
            expect(r.answers.data).toStrictEqual((new ConfigAnswers('')).data);
        });
    });

    describe('replaceDirProps', () => {
        it('relative path', () => {
            const [r] = RunnerFactory('haha=123');
            expect(r.replaceDirProps('./__haha__/bar')).toBe('./123/bar');
            expect(r.replaceDirProps('__haha__/bar')).toBe('123/bar');
        });

        it('absolute path', () => {
            const [r] = RunnerFactory('haha=123');
            expect(r.replaceDirProps('/__haha__/bar')).toBe('/123/bar');
        });
        
        it('multiple underscores', () => {
            const [r] = RunnerFactory('haha=bb');
            expect(r.replaceDirProps('/_123__haha__ha_/bar')).toBe('/_123bbha_/bar');
        });
    });

    describe('getFinalPaths', () => {
        it('basic usage', () => {
            const [r] = RunnerFactory('');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output')).toStrictEqual({
                outputPath: '/a/b/output/template.ts',
                outputDirPath: '/a/b/output'
            });
        });
        
        it('specified simple rename', () => {
            const [r] = RunnerFactory('');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output', 'rename.ts')).toStrictEqual({
                outputPath: '/a/b/output/rename.ts',
                outputDirPath: '/a/b/output'
            });
        });
        
        it('specified rename with placeholder', () => {
            const [r] = RunnerFactory('name=haha');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output', '__name__/rename.ts')).toStrictEqual({
                outputPath: '/a/b/output/haha/rename.ts',
                outputDirPath: '/a/b/output/haha'
            });
        });
    });

    describe('modify', () => {
        it('validation', async () => {
            const [r] = RunnerFactory('', './mock/modify/validation.json');
            let e: any = null;
            try {
                await r.modify();
            } catch(err) {
                e = err;
            }
            expect(() => { throw e }).toThrowError(ConfigError);
        });

        it('relative code path', async () => {
            const [r] = RunnerFactory('', './mock/modify/relative.json');
            const tasks = await r.modify();
            expect(tasks.length).toBe(1);
            expect(tasks[0].filePath).toBe(resolveDirname(__dirname, './mock/modify/code'));
            expect(tasks[0].rules).toStrictEqual([]);
        });
        
        it('absolute code path', async () => {
            const config = require('./mock/modify/relative.json');
            // manually change the file path to absolute path
            config.modify[0].file = resolveDirname(__dirname, './mock/modify/code');
            const r = new Runner(
                config,
                require.resolve('./mock/modify/relative.json'),
                new ConfigAnswers('')
            ) as any;
            const tasks = await r.modify();
            expect(tasks.length).toBe(1);
            expect(tasks[0].filePath).toBe(resolveDirname(__dirname, './mock/modify/code'));
            expect(tasks[0].rules).toStrictEqual([]);
        });
    });

    describe('generate', () => {
        it('basic', async () => {
            const [r, _, confPath] = RunnerFactory('commonOutput=./generate', './mock/generate/basic.json');

            const [task] = await r.generate();
            expect(_).toBeTruthy();
            expect(task.outputDirPath).toBe(resolveCwd('./generate'));
            expect(task.outputPath).toBe(resolveCwd('./generate/style.less'));
            expect(task.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/style.less'));
            expect(task.preDir).toBe(resolveCwd('./generate'));
        });

        it('extraDir', async () => {
            const [r, _, confPath] = RunnerFactory('commonOutput=./generate', './mock/generate/extra-dir.json');

            const [task] = await r.generate();
            expect(_).toBeTruthy();
            expect(task.outputDirPath).toBe(resolveCwd('./generate/foo/bar'));
            expect(task.outputPath).toBe(resolveCwd('./generate/foo/bar/style.less'));
            expect(task.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/style.less'));
            expect(task.preDir).toBe(resolveCwd('./generate'));
        });
        
        it('extraDir with placeholder', async () => {
            const [r, _, confPath] = RunnerFactory(
                'name=test,commonOutput=./generate',
                './mock/generate/extra-dir-placeholder.json'
            );

            const [task] = await r.generate();
            expect(_).toBeTruthy();
            expect(task.outputDirPath).toBe(resolveCwd('./generate/test/bar'));
            expect(task.outputPath).toBe(resolveCwd('./generate/test/bar/style.less'));
            expect(task.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/style.less'));
            expect(task.preDir).toBe(resolveCwd('./generate'));
        });
        
        it('rule output', async () => {
            const [r, _, confPath] = RunnerFactory(
                'name=test,output-0=./test',
                './mock/generate/rule-output.json'
            );

            const [task] = await r.generate();
            expect(_).toBeTruthy();
            expect(task.outputDirPath).toBe(resolveCwd('./test'));
            expect(task.outputPath).toBe(resolveCwd('./test/style.less'));
            expect(task.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/style.less'));
            expect(task.preDir).toBe(resolveCwd('./test'));
        });
        
        it('template object', async () => {
            const [r, _, confPath] = RunnerFactory(
                'type=class,commonOutput=./test',
                './mock/generate/template-object.json'
            );

            const [task] = await r.generate();
            expect(_).toBeTruthy();
            expect(task.outputDirPath).toBe(resolveCwd('./test'));
            expect(task.outputPath).toBe(resolveCwd('./test/class.ts'));
            expect(task.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/class.ts'));
            expect(task.preDir).toBe(resolveCwd('./test'));
        });
        
        it('template object validation', async () => {
            const [r] = RunnerFactory(
                'type=null,commonOutput=./test',
                './mock/generate/template-object.json'
            );
            let e: any = null
            try {
                await r.generate();
            } catch(err) {
                e = err;
            }
            expect(() => { throw e }).toThrowError(ConfigError);
        });
        
        it('rename with multiple rules', async () => {
            const [r, _, confPath] = RunnerFactory(
                'name=foo,type=class,commonOutput=./test',
                './mock/generate/rename.json'
            );

            const [t1, t2] = await r.generate();
            expect(_).toBeTruthy();
            expect(t1.outputDirPath).toBe(resolveCwd('./test/foo'));
            expect(t1.outputPath).toBe(resolveCwd('./test/foo/index.ts'));
            expect(t1.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/class.ts'));
            expect(t1.preDir).toBe(resolveCwd('./test'));
            expect(t2.outputDirPath).toBe(resolveCwd('./test/foo'));
            expect(t2.outputPath).toBe(resolveCwd('./test/foo/style.less'));
            expect(t2.tempPath).toBe(path.resolve(require.resolve(confPath), '../template/style.less'));
            expect(t2.preDir).toBe(resolveCwd('./test'));
        });
    });
    
    describe('run', () => {
        it('basic generate', async () => {
            await beforeGenerate('basic-generate');
            
            const [r] = RunnerFactory(
                'name=foo,type=class,commonOutput=./tests/Runner/mock/run/basic-generate/output',
                './mock/run/basic-generate/automan.json'
            );

            await r.run();
            
            const files = readdirSync(
                resolveDirname(__dirname, `./mock/run/basic-generate/output/foo`)
            );
            expect(files).toContain('index.tsx');
            expect(files).toContain('style.less');
        });
        
        it('basic modify', async () => {
            await beforeModify('basic-modify');
            
            const [r] = RunnerFactory(
                '',
                './mock/run/basic-modify/automan.json'
            );

            await r.run();
            
            const content = readFileSync(
                resolveDirname(__dirname, './mock/run/basic-modify/template/code.ts'),
                'utf8'
            );
            expect(content.includes('router.route.add(123)')).toBe(true);
        });
        
        it('generate and modify', async () => {
            await beforeGenerate('generate-modify');
            await beforeModify('generate-modify');
            
            const [r] = RunnerFactory(
                'name=foo,type=class,commonOutput=./tests/Runner/mock/run/generate-modify/output',
                './mock/run/generate-modify/automan.json'
            );

            await r.run();
            
            const content = readFileSync(
                resolveDirname(__dirname, './mock/run/generate-modify/template/code.ts'),
                'utf8'
            );
            const files = readdirSync(
                resolveDirname(__dirname, `./mock/run/generate-modify/output/foo`)
            );
            expect(files).toContain('index.tsx');
            expect(files).toContain('style.less');
            expect(content.includes('router.route.add(foo)')).toBe(true);
        });
    });
});