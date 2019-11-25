import { LiteralTypeList } from "./utils/ast";

export class ASTBuildError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ASTBuildLiteralError extends ASTBuildError {
    builder: string;
    
    constructor(builder: string) {
        super(`not supported type for build ${builder} ast node, must be one of ${LiteralTypeList}`);
        this.name = this.constructor.name;
        this.builder = builder;
    }
}

export class EmitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class RollbackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ModifyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ConfigPropsError extends ConfigError {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}