import { Task } from '../../src/Task';
import path from 'path';

class MockTask extends Task {
    validate() {
        return true;
    }
    dryrun() {
        return true;
    }
    async run() {
        return true;
    }
    async rollback() {
        return true;
    }
}
describe('Task', () => {
    it('initialization', () => {
        const t = new MockTask('generate');
        expect(t.taskType).toBe('generate');
    });

    it('fileExistsValidator dir', () => {
        const t = new MockTask('generate') as any;
        const p = path.resolve(__dirname, './mock');
        expect(t.fileExistsValidator(p)).toBe(true);
    });
    
    it('fileExistsValidator file', () => {
        const t = new MockTask('generate') as any;
        const p = path.resolve(__dirname, './mock/generate.json');
        expect(t.fileExistsValidator(p)).toBe(true);
    });
    
    it('permissionValidator file doesn\'t exist, should be true', () => {
        const t = new MockTask('generate') as any;
        const p = path.resolve(__dirname, './mock/null');
        expect(t.permissionValidator(p)).toBe(true);
    });
});