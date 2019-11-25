import ConfigAnswers from '../src/ConfigAnswers';
import { ConfigPropsError } from '../src/Errors';

describe('ConfigAnswers', () => {
    describe('initialization', () => {
        it('using object', () => {
            const configAnswers = new ConfigAnswers({
                name: 123, 
            });
            expect(configAnswers.data).toEqual({
                name: 123
            });
        });
        
        it('using string, simple', () => {
            const configAnswers = new ConfigAnswers('name=123');
            expect(configAnswers.data).toEqual({
                name: '123'
            });
        });
        
        it('using string, missing value', () => {
            const configAnswers = new ConfigAnswers('name=');
            expect(configAnswers.data).toEqual({
                name: ''
            });
        });
        
        it('others', () => {
            expect(() => new ConfigAnswers(123 as any)).toThrowError(ConfigPropsError);
            
            expect(() => new ConfigAnswers([] as any)).toThrowError(ConfigPropsError);
            
            expect(() => new ConfigAnswers(false as any)).toThrowError(ConfigPropsError);
            
            expect(() => new ConfigAnswers(null as any)).toThrowError(ConfigPropsError);
            
            expect(() => new ConfigAnswers(undefined as any)).toThrowError(ConfigPropsError);
        });
    });

    describe('readonly', () => {
        it('can not modify ConfigAnswers.data\'s value', () => {
            const answers = new ConfigAnswers('name=123');
            expect(() => answers.data.name = '234').toThrowError(Error);
        });

        it('can not add new props to ConfigAnswers.data', () => {
            const answers = new ConfigAnswers('name=123');
            expect(() => answers.data.test = '234').toThrowError(Error);
        });
        
        it('can not replace ConfigAnswers.data', () => {
            const answers = new ConfigAnswers('name=123');
            expect(() => (answers as any).data = {}).toThrowError(Error);
        });
    });
});