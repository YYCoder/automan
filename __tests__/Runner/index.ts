import Runner from '../../src/Runner';
import ConfigAnswers from '../../src/ConfigAnswers';
import { ConfigError } from '../../src/Errors';
// import { ModifyTask } from '../../src/Task';
import path from 'path';

const initRunner = (props: string = '', confPath: string = './mock/initialization/automan.json') => {
    const config = require(confPath);
    return [
        new Runner(config, require.resolve(confPath), new ConfigAnswers(props)),
        config,
        confPath
    ];
};
describe('Runner', () => {
    describe('initialization', () => {
        it('basic usage', () => {
            const [r, config, confPath] = initRunner();
    
            expect(r.name).toBe('mock');
            expect(r.description).toBe('initialization');
            expect(r.config).toStrictEqual(config);
            expect(r.configPath).toBe(require.resolve(confPath));
            expect(r.answers.data).toStrictEqual((new ConfigAnswers('')).data);
        });
    });

    describe('replaceDirProps', () => {
        it('relative path', () => {
            const [r] = initRunner('haha=123');
            expect(r.replaceDirProps('./__haha__/bar')).toBe('./123/bar');
            expect(r.replaceDirProps('__haha__/bar')).toBe('123/bar');
        });

        it('absolute path', () => {
            const [r] = initRunner('haha=123');
            expect(r.replaceDirProps('/__haha__/bar')).toBe('/123/bar');
        });
        
        it('multiple underscores', () => {
            const [r] = initRunner('haha=bb');
            expect(r.replaceDirProps('/_123__haha__ha_/bar')).toBe('/_123bbha_/bar');
        });
    });

    describe('getFinalPaths', () => {
        it('basic usage', () => {
            const [r] = initRunner('');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output')).toStrictEqual({
                outputPath: '/a/b/output/template.ts',
                outputDirPath: '/a/b/output'
            });
        });
        
        it('specified simple rename', () => {
            const [r] = initRunner('');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output', 'rename.ts')).toStrictEqual({
                outputPath: '/a/b/output/rename.ts',
                outputDirPath: '/a/b/output'
            });
        });
        
        it('specified rename with placeholder', () => {
            const [r] = initRunner('name=haha');
            expect(r.getFinalPaths('/a/b/template.ts', '/a/b/output', '__name__/rename.ts')).toStrictEqual({
                outputPath: '/a/b/output/haha/rename.ts',
                outputDirPath: '/a/b/output/haha'
            });
        });
    });

    describe('modify', () => {
        it('validation', async () => {
            const [r] = initRunner('', './mock/modify/validation.json');
            let e: any = null;
            try {
                await r.modify();
            } catch(err) {
                e = err;
            }
            expect(() => { throw e }).toThrowError(ConfigError);
        });

        it('relative code path', async () => {
            const [r] = initRunner('', './mock/modify/relative.json');
            const tasks = await r.modify();
            expect(tasks.length).toBe(1);
            expect(tasks[0].filePath).toBe(path.resolve(__dirname, './mock/modify/code'));
            expect(tasks[0].rules).toStrictEqual([]);
        });
        
        it('absolute code path', async () => {
            const config = require('./mock/modify/relative.json');
            // manually change the file path to absolute path
            config.modify[0].file = path.resolve(__dirname, './mock/modify/code');
            const r = new Runner(
                config,
                require.resolve('./mock/modify/relative.json'),
                new ConfigAnswers('')
            ) as any;
            const tasks = await r.modify();
            expect(tasks.length).toBe(1);
            expect(tasks[0].filePath).toBe(path.resolve(__dirname, './mock/modify/code'));
            expect(tasks[0].rules).toStrictEqual([]);
        });
    });

    describe('generate', () => {
        
    });
    
    describe('run', () => {

    });
});