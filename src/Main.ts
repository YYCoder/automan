import log from 'debug';
import Runner from './Runner';
import isGitClean from 'is-git-clean';
import { warning, error, greenBright, boldRed } from "./ui";
import { ConfigPropsError, ConfigError } from "./Errors";
import path, { isAbsolute } from "path";
import { Config } from "../types";
import { QuestionTypeMap, Question } from "../types";
import { validatorFactory } from "./utils/validator";
import glob from "glob";
import ConfigAnswers from "./ConfigAnswers";
import inquirer from "inquirer";
import { isString } from "./utils/typeGuards";

const debug = log('automan:Main');

export default class Main {
    private _program: any;
    private _answers: ConfigAnswers;
    private _questions: inquirer.Question<inquirer.Answers>[];
    
    constructor(program: any) {
        this._program = program;
        this._answers = new ConfigAnswers('');
        this._questions = [];
    }

    private isQuestionAllAnswered = (): boolean | string => {
        const q = this._questions.find((q) => {
            return !((q as any).name in this._answers.data);
        }) as inquirer.Question;
        
        if (!q) return true;
        
        return (q as any).message;
    }

    private isAnswersTypeAllValid = (): boolean | string => {
        const q = this._questions.find((q: any) => {
            return isString(q.validate(this._answers.data[q.name]));
        }) as inquirer.Question;
        
        if (!q) return true;
        
        return (q as any).name;
    }

    private getAnswers = async () => {
        const { props, mode } = this._program;
        
        if (mode === 'command') {
            debug(greenBright('command mode, answers string: '), props);
            this._answers = new ConfigAnswers(props);
        }
        else {
            const data = await inquirer.prompt(this._questions);
            this._answers = new ConfigAnswers(data);
        }
        debug(greenBright('answers data: '), this._answers.data);
    }

    // TODO: support config.js/config.yaml and multiple config within a
    // config dir
    private resolveConfig = (): [Config, string] => {
        const { config } = this._program;
        const confPath = isAbsolute(config) ?
            config :
            path.resolve(process.cwd(), config);
        debug('config path: ', confPath);
        try {
            const configObj = require(confPath);

            return [configObj, confPath];
        } catch (e) {
            throw new ConfigError(e.message);
        }
    };

    private isGitClean(): boolean {
        const { force = false } = this._program;
        let clean = false;
        let errorMessage = 'Unable to determine if git directory is clean';
        try {
            clean = isGitClean.sync(process.cwd());
            errorMessage = 'Git directory is not clean';
        } catch (err) {
            if (err && err.stderr && err.stderr.indexOf('Not a git repository') >= 0) {
                clean = true;
            }
        }
    
        if (!clean) {
            if (force) {
                warning(`WARNING: ${errorMessage}. Forcibly continuing.`);
                clean = true;
            } else {
                warning('Before we continue, please stash or commit your git changes.')
                warning('You may use the --force flag to override this safety check.');
            }
        }
        return clean;
    }

    // TODO: validate config schema
    private isConfigValid = (config: Config): boolean => {
        if (!config) {
            this._program.outputHelp();
            return false;
        }
        return true;
    }

    private getQuestions = (config: Config) => {
        const questions = config?.props?.map(this.generateInquirerOptions) ?? [];
        const gOutput = config?.generate?.output;
        const gRules = config?.generate?.rules ?? [];

        // if both commonOutput and ruleOutput exist, then the rule use it's ruleOutput, and
        // those rules doesn't specify output use commonOutput
        if (gOutput) {
            questions.push(this.generateInquirerOptions({ name: 'commonOutput', ...gOutput }));
        }
        gRules.forEach(({ output }, i) => {
            if (output) questions.push(this.generateInquirerOptions({ name: `output-${i}`, ...output }));
        });

        this._questions = questions;
    }

    private getAutoCompletePath = async (_: any, input: string) => {
        return new Promise((res, rej) => {
            // when input is undefined, use '' instead, to match all dirs
            const value = input ?? '';
            glob(`**/*${value}*/`, {
                ignore: '**/node_modules/**'
            }, (e: Error, matches) => {
                if (e) rej(e);
                res(['./', ...matches]);
            });
        });
    };

    private generateInquirerOptions = (
        { name, description, type, prompt, validate }: Question
    ): inquirer.Question => {
        debug('generateInquirerOptions start');
        const props: any = {
            name,
            message: description,
            type: QuestionTypeMap[type]
        };
        if (type === 'list') {
            props.choices = prompt;
        }
        if (type === 'path') {
            props.source = this.getAutoCompletePath;
        }
        if (validate?.length !== 0) {
            props.validate = validatorFactory(validate);
        }
        debug('generateInquirerOptions done: ', props);
        return props;
    };

    bootstrap = async () => {
        const { dryrun } = this._program;
        const [configObj, confPath] = this.resolveConfig();
        
        if (!this.isGitClean() || !this.isConfigValid(configObj)) {
            process.exit(1);
        }

        this.getQuestions(configObj);

        await this.getAnswers();

        const allRes = this.isQuestionAllAnswered();

        if (isString(allRes)) {
            error(new ConfigPropsError(`question "${boldRed(allRes)}" have not been answered.`));
            process.exit(1);
        }

        const typeRes = this.isAnswersTypeAllValid();

        if (isString(typeRes)) {
            error(new ConfigPropsError(`answer "${boldRed(typeRes)}" has wrong type.`));
            process.exit(1);
        }
        
        const runner = new Runner(configObj, confPath, this._answers);
        await runner.run(dryrun);
    };
}