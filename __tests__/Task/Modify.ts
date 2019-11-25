import { ModifyTask } from '../../src/Task';
import path from 'path';
import fs from 'fs';
import { ModifyRule } from '../../types';
import { RollbackError } from '../../src/Errors';

const filePath = path.resolve(__dirname, './mock/code-to-modify');
const initTask = (file?: string, rules?: ModifyRule[]): ModifyTask => {
    return new ModifyTask(file ?? filePath, rules ?? []);
};
describe('ModifyTask', () => {
    describe('initialization', () => {
        it('basic usage', () => {
            const task = initTask() as any;
    
            expect(task.filePath).toBe(filePath);
            expect(task.rules).toStrictEqual([]);
        });
    });

    describe('validate', () => {
        it('valid config', () => {
            const task = initTask();
            expect(task.validate()).toBe(true);
        });
        
        it('non-exist file', () => {
            const p = path.resolve(__dirname, './mock/null');
            const task = initTask(p);
            expect(task.validate()).toBe(`${p} doesn't exists`);
        });
    });

    describe('dryun', () => {
        it('basic usage', () => {
            const task = initTask();
            expect(task.dryrun()).toBe(true);
        });
    });

    describe('run', () => {
        it('basic usage', async () => {
            // TODO: technically, we should not use a Transformer here, cause unit test should only involve
            // current file, let me figure out how to decouple this in the future
            const task = initTask(filePath, [
                {
                    "transformer": "AddCallChain",
                    "func": "add",
                    "root": "haha",
                    "args": [123]
                }
            ]);
            await task.run({});
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toBe('haha().add(123).add().add();');
            fs.writeFileSync(filePath, 'haha().add().add();');
        });
    });

    describe('rollback', () => {
        it('basic usage', async () => {
            const task = initTask(filePath, [
                {
                    "transformer": "AddCallChain",
                    "func": "add",
                    "root": "haha",
                    "args": [123]
                }
            ]);
            await task.run({});
            await task.rollback();
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toBe('haha().add().add();');
        });

        it('non-exist file', async () => {
            const f = path.resolve(__dirname, './mock/code-to-remove');
            if (!fs.existsSync(f)) {
                fs.writeFileSync(f, 'haha().add().add();');
            }
            const task = initTask(f, [
                {
                    "transformer": "AddCallChain",
                    "func": "add",
                    "root": "haha",
                    "args": [123]
                }
            ]);
            await task.run({});
            fs.unlinkSync(f);
            let e: any = null;
            try {
                await task.rollback();
            } catch(err) {
                e = err;
            }
            expect(() => { throw e }).toThrowError(RollbackError);
            fs.writeFileSync(f, 'haha().add().add();');
        });
    });
});