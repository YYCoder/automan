import { Config } from '../types';
import { parse as pathParse, resolve, isAbsolute } from 'path';
import log from 'debug';
import { isString, isTemplateObj } from './utils/typeGuards';
import { info, error, boldOrange, warning } from './ui';
import { GenerateTask, ModifyTask } from './Task';
import { ConfigError } from './Errors';
import { isArray } from 'util';
import ConfigAnswers from './ConfigAnswers';

const debug = log('automan:Runner');

interface getFinalPathsRes {
    outputPath: string;
    outputDirPath: string;
}

export default class Runner {
    configPath: string; // absolute path for configuration file
    name: string;
    description: string;
    config: Config;
    answers: ConfigAnswers;
    
    constructor(config: Config, configPath: string, answers: ConfigAnswers) {
        const { name, description } = config;
        this.name = name;
        this.description = description;
        this.config = config;
        this.configPath = configPath;
        this.answers = answers;
    }

    private replaceDirProps = (path: string): string => {
        let resPath = path;
        if (/__\w+__/g.test(resPath)) {
            resPath = resPath.replace(
                /(__(\w+)__)/g,
                (_: string, _$1: string, $2: string) => this.answers.data[$2]
            );
        }
        return resPath;
    }

    private getFinalPaths = (
        tempPath: string,
        originOutputDir: string,
        rename?: string // possibly contains path (e.g. __name__/file.txt)
    ): getFinalPathsRes => {
        const fileName = rename ?? pathParse(tempPath)?.base;
        const outputPath = this.replaceDirProps(resolve(originOutputDir, fileName));
        const outputDirPath = pathParse(outputPath)?.dir;
        const res: getFinalPathsRes = {
            outputPath,
            outputDirPath
        };
        
        debug('getFinalPaths: ', res);
        return res;
    }

    async run(dryrun: boolean = false) {
        const tasks = [...await this.generate(), ...await this.modify()];

        const validateRes = tasks.reduce((res, task) => res && task.validate(), true);
        if (isString(validateRes)) {
            warning(`😭 ${validateRes}`);
            return;
        }

        try {
            await Promise.all(
                tasks.map((task) => task.run(this.answers.data, dryrun))
            );
            if (!dryrun) info(`workflow ${this.name} succeed 😁`);
        } catch(e) {
            await Promise.all(tasks.map((t) => t.rollback()));
            error(e);
        }
    }

    private async generate(): Promise<GenerateTask[]> {
        const rules = this.config?.generate?.rules ?? [];
        const extraDir = this.config?.generate?.extraDir ?? '';
        const data = this.answers.data;
        
        const tasks = rules.map(({ template, rename }, i) => {
            let tempPath = '';
            const outputFromData = data[`output-${i}`] ?? data.commonOutput;

            if (isString(template)) {
                tempPath = resolve(this.configPath, '..', template);
            }
            else if (isTemplateObj(template)) {
                const prop = template?.prop;
                const value = template?.value ?? {};
                const temp = value[data[prop]];
                if (!temp) {
                    throw new ConfigError(`generate rule template ${prop} value ${temp} doesn\'t match config props ${prop}\'s values.`);
                }
                tempPath = resolve(this.configPath, '..', temp);
            }
            const { outputDirPath, outputPath } = this.getFinalPaths(
                tempPath,
                resolve(process.cwd(), outputFromData, extraDir),
                rename
            );

            debug(boldOrange('outputDirPath '), outputDirPath);
            debug(boldOrange('outputPath '), outputPath);
            
            return new GenerateTask(
                {
                    outputDirPath, outputPath, tempPath
                },
                resolve(process.cwd(), outputFromData)
            );
        });

        return tasks;
    }

    private async modify() {
        const modifies = this.config?.modify ?? [];

        if (!isArray(modifies)) {
            throw new ConfigError('modify config must be an array');
        }
        const tasks = modifies.map(({ file, rules }) => {
            const filePath = isAbsolute(file) ? file : resolve(this.configPath, '..', file);
            return new ModifyTask(filePath, rules);
        });

        return tasks;
    }
}