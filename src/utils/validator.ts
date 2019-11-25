import inquirer from "inquirer";

export interface Validator {
    (input: string): boolean | string;
}
export type Validators = typeof validators;
export type ValidateTypes = keyof Validators;

export const validators = {
    ascii: (input: string) => {
        const res = /[\x00-\xff]+/g.test(input);
        if (res) return res;
        return 'you can only use ascii character';
    },
    path: (input: string) => {
        const res = /^(\/|\.\/|\.)?[\w-_]+(\/[\w-_]+)*$/.test(input) ||
            input === '' || input === './' || input === '.';
        if (res) return res;
        return 'not a valid path';
    },
    number: (input: string) => {
        const res = /^[\d\.]+$/.test(input);
        if (res) return res;
        return 'not a valid number';
    },
    boolean: (input: string) => {
        const res = /^(true|false)$/.test(input);
        if (res) return res;
        return 'not a valid boolean literal';
    }
};

// TODO: support specifying custom validator
export const validatorFactory = (types: ValidateTypes[]): inquirer.Validator => {
    return (input: string) => types.reduce((res: boolean | string, type: ValidateTypes) => {
        if (res !== true) return res;
        return validators[type](input);
    }, true);
};