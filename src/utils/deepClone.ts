import { ObjectType } from "../../types/utils"

export default function deepClone<T extends ObjectType>(obj: T, parent?: T): T {
    let res: ObjectType;
    // 通过 parent 参数对象，保存父对象引用
    let _parent: ObjectType | null = parent ?? null;
    // 遍历父对象引用，判断当前节点是否等于祖先中某个节点引用，若是则存在循环引用，直接返回引用的节点
    while (_parent) {
        if (obj === _parent.currentParent) return obj;
        _parent = _parent.parent;
    }
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    } else if (obj instanceof Array) {
        res = [];
        for (let i = 0; i < obj.length; i++) {
            typeof obj[i] === 'object'
                ? (res[i] = deepClone(obj[i], { parent: parent, currentParent: obj }))
                : (res[i] = obj[i])
        }
    } else {
        res = {}
        Object.getOwnPropertyNames(obj).forEach((k) => {
            typeof obj[k] === 'object'
                ? (res[k] = deepClone(obj[k], { parent: parent, currentParent: obj }))
                : (res[k] = obj[k])
        });
    }

    return res as T;
}