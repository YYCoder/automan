import { namedTypes } from 'ast-types';
import { ModifyRule } from '../../types';

export default abstract class BaseTransformer {
    abstract transform(ast: namedTypes.Program): namedTypes.Program;

    static preprocessRule: (rule: ModifyRule, data: object) => ModifyRule;
}