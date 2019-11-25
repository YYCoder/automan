import inquirer from 'inquirer';
import { CodeUnitArray } from './utils';
import { ValidateTypes } from '../src/utils/validator';

export type AutomanMode = 'interact' | 'command';

export type QuestionType = 'string' | 'list' | 'path';

export const QuestionTypeMap = {
    string: 'input',
    boolean: 'input',
    number: 'input',
    path: 'autocomplete',
    list: 'list',
}

export interface Question {
    name: string;
    type: QuestionType;
    description: string;
    validate: ValidateTypes[];
    prompt?: inquirer.ListChoiceOptions;
}

export type GenerateOutputQuestion = Omit<Question, 'name'>

export interface GenerateTemplateObject {
    prop: string;
    value: {
        [key: string]: string;
    }
}

export type GenerateTemplate = string | GenerateTemplateObject;

export interface GenerateRule {
    template: GenerateTemplate; // 相对配置文件的路径
    rename?: string; // 可以带路径
    output?: GenerateOutputQuestion; // 优先使用特定 rule 的 output
}

export interface AddCallChainRule {
    transformer: 'AddCallChain';
    func: string; // function to call
    root: string; // call chain's first MemberExpression except func (e.g., obj.route.add().add() => route)
    args: CodeUnitArray; // arguments
}

export interface GenerateConfig {
    output?: GenerateOutputQuestion;
    rules: GenerateRule[];
    extraDir?: string;
}

export type ModifyRule = AddCallChainRule;

export interface ModifyConfig {
    file: string; // 同一个文件的修改，必须写在同一个 config.rules 下
    rules: ModifyRule[];
}

export interface Config {
    name: string;
    description: string;
    props: Question[];
    generate: GenerateConfig;
    modify: ModifyConfig[];
}



