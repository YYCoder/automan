import ejs from "ejs";
import mkdirp from "mkdirp";
import fs from "fs";
import log from "debug";
import rimraf from "rimraf";
import { boldOrange, greenBright, info } from "./ui";
import { EmitError, RollbackError, ModifyError } from "./Errors";
import { ModifyRule } from "../types";
import { parse } from "recast";
import { toSource } from "./utils/ast";
import { jsonstringify, relativeRoot } from "./utils";
import { resolve } from "path";

const debug = log('automan:Task');


export type TaskType = 'generate' | 'modify';
export interface GenerateTaskConfig {
    outputDirPath: string;
    outputPath: string;
    tempPath: string;
};

export abstract class Task {
    constructor(private type: TaskType) {}

    get taskType(): string {
        return this.type;
    }

    protected fileExistsValidator = (path: string) => {
        return fs.existsSync(path);
    }
    protected permissionValidator = (path: string) => {
        // only validate existed path
        if (!this.fileExistsValidator(path)) return true;
        try {
            fs.accessSync(path, fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    abstract validate(): boolean | string;
    abstract dryrun(): boolean;
    abstract run(data: object, dryrun: boolean): Promise<unknown>;
    abstract rollback(): Promise<unknown>;
}


export class GenerateTask extends Task {
    // dir contains generated file
    private outputDirPath: string;
    // generated file's full path
    private outputPath: string;
    private tempPath: string;
    // the original dir which contains generated dirs or files
    private preDir: string;
    
    constructor(
        config: GenerateTaskConfig,
        preDir: string
    ) {
        super('generate');
        this.outputDirPath = config.outputDirPath;
        this.outputPath = config.outputPath;
        this.tempPath = config.tempPath;
        this.preDir = preDir;
    }

    validate(): boolean | string {
        if (this.fileExistsValidator(this.outputPath)) {
            return `${this.outputPath} already exists`;
        }
        if (!this.fileExistsValidator(this.tempPath)) {
            return `template ${this.tempPath} doesn't exists`;
        }
        if (!this.permissionValidator(this.outputDirPath)) {
            return `don't have write permission to ${this.outputDirPath}`;
        }
        return true;
    }

    dryrun() {
        info(`about to generate ${greenBright(this.outputPath)}`);
        return true;
    }

    async run(data: object, dryrun: boolean = false) {
        if (dryrun) {
            return this.dryrun();
        }
        try {
            const res = await ejs.renderFile(this.tempPath, data);

            debug(boldOrange('mkdir -p '), this.outputDirPath);
            await mkdirp(this.outputDirPath);

            debug(boldOrange('writeFileSync '), this.outputPath);
            return new Promise((resolve, reject) => {
                fs.writeFile(this.outputPath, res, (err) => {
                    if (err) {
                        reject(new EmitError(err.message));
                        return;
                    }
                    debug(greenBright(`generate ${this.outputPath} succeed`));
                    resolve(true);
                });
            });
        } catch(e) {
            throw new EmitError(e.message);
        }
    }

    async rollback(): Promise<boolean | Error> {
        const dirToRemove = relativeRoot(this.preDir, this.outputPath);
        debug(boldOrange('GenerateTask rollback dirToRemove: '), dirToRemove);
        
        if (this.fileExistsValidator(this.outputPath)) {
            return new Promise((res, rej) => {
                rimraf(resolve(this.preDir, dirToRemove), {}, (err) => {
                    if (err) {
                        rej(new RollbackError(err.message));
                    }
                    res(true);
                });
            });
        }
        return true;
    }
}


export class ModifyTask extends Task {
    private filePath: string; // file to modify
    private rules: ModifyRule[]; // rules to be applied to the file
    private originFileBuffer: Buffer; // origin file buffer in order to rollback
    
    constructor(filePath: string, rules: ModifyRule[]) {
        super('modify');
        this.filePath = filePath;
        this.rules = rules;
    }

    dryrun() {
        const rules = [...new Set(this.rules.map(({ transformer }) => transformer))];
        info(`about to modify ${greenBright(this.filePath)} and apply these rules: ${greenBright(rules)}`);
        return true;
    }

    async run(data: object, dryrun?: boolean) {
        if (dryrun) {
            return this.dryrun();
        }
        try {
            debug(boldOrange('getting originFileBuffer'));
            this.originFileBuffer = await new Promise((res, rej) => {
                fs.readFile(this.filePath, (err, buf) => {
                    if (err) {
                        return rej(err);
                    }
                    res(buf);
                });
            });
            
            debug(greenBright('got originFileBuffer'));
            
            debug(boldOrange('recast parsing originFileBuffer'));
            const ast = parse(
                this.originFileBuffer.toString('utf8'),
                {
                    parser: require("recast/parsers/typescript")
                }
            );
            debug(greenBright('recast parse originFileBuffer succeed'));

            debug(boldOrange('applying rules to transform ast'));
            const transforms = await Promise.all(
                this.rules.map(async (rule) => {
                    const { transformer } = rule;
                    try {
                        const t = (await import(`./transforms/${transformer}`)).default;
                        debug(boldOrange('start process rule'));
                        const processedRule = t.preprocessRule(rule, data);
                        debug(greenBright('processedRule:'), jsonstringify(processedRule));
                        debug(`applying rule transformer: ${transformer}`);
                        return new t(processedRule);
                    } catch(e) {
                        throw new Error(`can't find transformer called ${transformer}.`);
                    }
                })
            );
            const resAst = transforms.reduce((ast, trans) => trans.transform(ast), ast);
            debug(greenBright('transform done'));

            debug(boldOrange('ast to source code'));
            const source = toSource(resAst);
            return new Promise((res, rej) => {
                fs.writeFile(this.filePath, source, (err) => {
                    if (err) return rej(err);
                    debug(greenBright('write source code done'));
                    res(true);
                });
            });
        } catch(e) {
            throw new ModifyError(e.message);
        }
    }

    validate(): boolean | string {
        if (!this.fileExistsValidator(this.filePath)) {
            return `${this.filePath} doesn't exists`;
        }
        if (!this.permissionValidator(this.filePath)) {
            return `don't have write permission to ${this.filePath}`;
        }
        return true;
    }

    async rollback(): Promise<boolean | Error> {
        debug(boldOrange('ModifyTask rollback filePath: '), this.filePath);
        if (this.fileExistsValidator(this.filePath)) {
            return new Promise((res, rej) => {
                fs.writeFile(this.filePath, this.originFileBuffer, (err) => {
                    if (err) {
                        rej(new RollbackError(err.message));
                    }
                    res(true);
                });
            });
        }
        throw new RollbackError(`${this.filePath} doesn't exist`);
    }
}