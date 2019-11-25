import { ObjectType } from "../types/utils";
import { isObject, isString } from "./utils/typeGuards";
import { ConfigPropsError } from "./Errors";

export default class ConfigAnswers {
    private _data: ObjectType;
    
    constructor(answers: string | ObjectType) {
        if (!isString(answers) && !isObject(answers)) {
            throw new ConfigPropsError('wrong type of argument ConfigAnswers, only support string and object');
        }
        this._data = isObject(answers) ? answers : this.commaListToObject(answers);
        Object.freeze(this._data);
    }

    /**
     * comma separated list string to map (e.g. name=123,type=234 => { name: "123", type: "234" })
     * @param str 
     * @return object
     * @NOTICE through this approach, all object values are string
     */
    private commaListToObject = (str: string): ObjectType => {
        return str.split(',').reduce((res, cur) => {
            const [key, val] = cur.split('=');
            res[key] = val;
            return res;
        }, {} as any);
    };

    get data() {
        return this._data;
    }
};