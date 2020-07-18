const router: any = {};

// 对象属性链式调用：需要找到根属性，即本例的 route，同时验证每个方法名是否为 add
/* router.route
    .add('123', 'haha', 'xixi')
    .add('1234', 'hahaa', 'xixix'); */
// 普通变量链式调用：需要找到根变量，即本例的 router，同时验证每个方法名是否为 add
// 思路：从最后往前遍历 CallExpression，遍历每个调用，判断每个调用的类型是否是 PropertyAccess，
// 并同时判断每个标识符是否为 add，若是则继续，否则退出。同时判断左侧类型，若是 CallExpression，则
// 继续遍历，直到左侧不是 CallExpression 为止，判断类型，若是 PropertyAccess，则判断右侧标识符是
// 否为指定标识符，若是 Identifyer，则判断左侧标识符是否为指定标识符
router.add("123", "haha", "xixi").add("1234", "hahaa", "xixix");

const haha = () => (({} as any));

// 普通函数链式调用：需要找到根调用，即本例的 haha()，同时验证每个方法名是否为 add
// 思路：若不是对象方法调用，则判断每个左侧 CallExpression 的子节点是否为 PropertyAccess，若是则
// 继续遍历，并判断标识符是否是 add，若不是，但是 CallExpression，则判断标识符是否为指定标识符
haha().add().add();

const fun = () => {
    // 嵌套调用
    fun1();

    // 即使是嵌套的也能找到！
    router.route.add("123", "haha", "xixi").add("1234", "hahaa", "xixix");
};

const fun1 = () => {};
fun();

const obj = {
    fun() {
        fun1();
    }
};

obj.fun();