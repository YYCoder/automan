import { builders as b, visit, namedTypes } from 'ast-types';
import { toSource, buildNodesFromArray } from '../utils/ast';
import { AddCallChainRule, ModifyRule } from '../../types';
import BaseTransformer from './Base';
import log from 'debug';
import { CodeUnitArray, AutomanConfigUnit } from '../../types/utils';
import deepClone from '../utils/deepClone';
import { isArray } from '../utils/typeGuards';
import { ModifyError } from '../Errors';
import { containEjsTemp, processEjs } from '../utils/config';
import { boldOrange, greenBright } from '../ui';
import { jsonstringify } from '../utils';

const debug = log('automan:AddCallChainTransformer');

export default class AddCallChainTransformer extends BaseTransformer {
    rule: AddCallChainRule;

    constructor(rule: AddCallChainRule) {
        super();
        this.rule = rule;
    }

    static preprocessRule = (rule: ModifyRule, data: object): ModifyRule => {
        const clonedRule = deepClone(rule);
        const { args } = clonedRule;
        if (!isArray(args)) throw new ModifyError('transformer AddCallChain args config must be array');

        args.forEach((arg: AutomanConfigUnit, i) => {
            const needProcess = containEjsTemp(arg);
            debug(boldOrange(`AddCallChain argument ${i}, needProcess: ${needProcess}`));
            if (needProcess) {
                args[i] = processEjs(arg, data);
            }
            const argToDebug = args[i] && (args[i] as any).value ?
                (args[i] as any).value :
                args[i];
            debug(
                greenBright(`AddCallChain argument ${i} process succeed`),
                jsonstringify(argToDebug)
            );
        });
        return clonedRule;
    }

    private buildCallNode(callee: any, args: CodeUnitArray) {
        return b.callExpression(
            callee,
            buildNodesFromArray(args)
        );
    }

    private buildMember(obj: any) {
        const { func } = this.rule;
        const {
            type, callee, name, object, property,
            arguments: args
        } = obj;
        if (type === 'Identifier') {
            return b.memberExpression(
                b.identifier(name),
                b.identifier(func)
            );
        }
        if (type === 'CallExpression') {
            return b.memberExpression(
                b.callExpression(callee, args),
                b.identifier(func)
            );
        }

        return b.memberExpression(
            b.memberExpression(
                object,
                b.identifier(property.name)
            ),
            b.identifier(func)
        );
    }

    private addCall(path: any) {
        const callNode = this.buildCallNode(
            this.buildMember(path.value),
            this.rule.args
        );
        path.replace(callNode);
    }
    
    transform(ast: namedTypes.Program): namedTypes.Program {
        const rule = this.rule;
        const addCall = this.addCall;
        const self = this;

        debug(boldOrange('start traverse'));
        
        visit(ast, {
            // since call chain are represented by MemberExpression in ast(using Esprima), so the
            // idea is that traverse all MemberExpressions which property is matched rule.func,
            // and compare the object(the left side of MemberExpression) if it matches these
            // three types, CallExpression/MemberExpression/Identifier. (e.g. rule.func is add, 
            // fun().add()/router.add()/router.route.add())
            visitMemberExpression(p) {
                const node = p.node;
                const { root, func } = rule;
                const { property } = node;
                if ((property as any).name !== func) return false;
        
                if (node.object.type === 'CallExpression') {
                    // if object is a CallExpression like fun().add(), fun is the root
                    if (
                        node.object.callee.type === 'Identifier' &&
                        node.object.callee.name === root
                    ) {
                        addCall.call(self, p.get('object'));
                        return false;
                    }
                    this.traverse(p);
                }
                else if (node.object.type === 'MemberExpression') {
                    const source = toSource(node.object);
                    if (source.endsWith(root)) {
                        // multiple MemberExpression's NodePath, e.g. router.route
                        addCall.call(self, p.get('object'));
                        return false;
                    }
                    this.traverse(p);
                }
                else if (node.object.type === 'Identifier') {
                    const source = toSource(node.object);
                    if (source === root) {
                        // single MemberExpression Identifier's NodePath, e.g. router
                        addCall.call(self, p.get('object'));
                        return false;
                    }
                    this.traverse(p);
                }
                return false;
            }
        });
        
        debug(greenBright('done traverse'));

        return ast;
    }
}
