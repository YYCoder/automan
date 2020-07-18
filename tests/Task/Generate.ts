import { GenerateTask } from '../../src/Task';
import path from 'path';
import fs from 'fs';

const initTask = (args: any): [GenerateTask, any, string] => {
    const config = {
        outputDirPath: path.resolve(__dirname, './mock'),
        outputPath: path.resolve(__dirname, './mock/file'),
        tempPath: path.resolve(__dirname, './mock/template.ejs'),
        ...args
    };
    const dir = path.resolve(__dirname, './mock');
    return [
        new GenerateTask(config, dir),
        config,
        dir
    ];
};
describe('GenerateTask', () => {
    describe('initialization', () => {
        it('basic usage', () => {
            const [task, config] = initTask({}) as any;
    
            expect(task.outputDirPath).toBe(config.outputDirPath);
            expect(task.outputPath).toBe(config.outputPath);
            expect(task.tempPath).toBe(config.tempPath);
        });
    });

    describe('validate', () => {
        it('valid config', () => {
            const [task] = initTask({});
            expect(task.validate()).toBe(true);
        });
        
        it('non-exist template', () => {
            const [task, config] = initTask({ tempPath: path.resolve(__dirname, './mock/null') });
            expect(task.validate()).toBe(`template ${config.tempPath} doesn't exists`);
        });

        it('outputPath already exists', () => {
            const [task, config] = initTask({ outputPath: path.resolve(__dirname, './mock/template.ejs') });
            expect(task.validate()).toBe(`${config.outputPath} already exists`);
        });
    });

    describe('dryun', () => {
        it('basic usage', () => {
            const [task] = initTask({});
            expect(task.dryrun()).toBe(true);
        });
    });

    describe('run', () => {
        it('basic usage', async () => {
            const [task, config] = initTask({});
            const res = await task.run({ name: 'haha' });
            const content = fs.readFileSync(config.outputPath, 'utf8');
            
            expect(res).toBe(true);
            expect(content).toBe('haha');

            fs.unlinkSync(config.outputPath);
        });
        
        it('mkdir -p', async () => {
            const [task, config] = initTask({
                outputPath: path.resolve(__dirname, './mock/output/file'),
                outputDirPath: path.resolve(__dirname, './mock/output'),
            });
            const res = await task.run({ name: 'haha' });
            const content = fs.readFileSync(config.outputPath, 'utf8');
            
            expect(res).toBe(true);
            expect(content).toBe('haha');

            fs.unlinkSync(config.outputPath);
            fs.rmdirSync(config.outputDirPath);
        });
    });

    describe('rollback', () => {
        it('basic usage', async () => {
            const [task, config] = initTask({});
            await task.run({ name: 'haha' });
            await task.rollback();
            expect(fs.existsSync(config.outputPath)).toBe(false);
        });
        
        it('extra dir', async () => {
            const [task, config] = initTask({
                outputPath: path.resolve(__dirname, './mock/output/file'),
                outputDirPath: path.resolve(__dirname, './mock/output'),
            });
            await task.run({ name: 'haha' });
            await task.rollback();
            expect(fs.existsSync(config.outputPath)).toBe(false);
        });
    });

});