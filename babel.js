
export default function ({types: t}) {
    return {
        /* 
        功能：可在react中直接使用 v-if 不过现在叫 r-if 了

            实现方式依托于babel。babel会将js文件转换成 AST抽象语法树（可以理解为把给人看的转换成给计算机看的）
            我们只需要访问AST语法抽象树并对其遍历找出带 r-if 标签的 element 对其修改就ok
            再修改AST中我们最关注的就是 visitor。visitor是AST中的访问者，在 visitor 中定义的每一项我们都可以在AST中寻找到
            可以通过 https://astexplorer.net/ 来在线查看AST语法抽象树

            以下出现的变量均为AST中自带的方法及变量
                
        */
        visitor: { // 在babel里称为访问者
            JSXElement: function (path) { // JSXElement => jsx中的组件元素
                let { node } = path; // path.node 可获取到该节点的AST
                // 遍历 JSXElement 上所有的属性并找出带r-if的
                let ifAttr = node.openingElement.attributes
                    .find(({type, name}) => type === 'JSXAttribute' && name.name === 'r-if');
                if (ifAttr == null) { // 如果ifAttr为undefined则表示该组件没有r-if，则停止访问
                    return;
                }
                // 如果ifAttr不为undefined则表示该组件有r-if。下一步是创建新的组件替换之

                /* 
                <div r-if="true"> 起始部位
                </div> 结束部位
                */


                // t.JSXOpeningElement表示创建一个组件（或者html标签）的起始部位，参数分别为：标签的类型，属性
                // 这里我创建了一个组件的起始部位，再将原有的属性赋给新的组件
                let jsxOpeningElement = t.JSXOpeningElement( 
                    node.openingElement.name,
                    node.openingElement.attributes
                        ? node.openingElement.attributes.filter((attr)=> attr !== ifAttr)
                        : null
                );
                // t.JSXElement 表示创建一个react组件（或者html标签），参数分别为：开始标签，结束标签，子集
                // 创建新的react组件，并讲上一步创建好的起始部位拿过来
                let jsxElement = t.JSXElement(
                    jsxOpeningElement,
                    node.closingElement,
                    node.children
                );
                // t.conditionalExpression 创建一个三元表达式 ，参数分别为：条件，为真时执行，为假时执行
                // 等于：expression = r-if === true? <div></div> : null
                let expression = t.conditionalExpression(
                    ifAttr.value.expression, // r-if=“true” 
                    jsxElement, // 创建好的react组件
                    t.nullLiteral() // 这个方法会返回一个 null
                );
                //  replaceWith 方法为替换方法
                path.replaceWith(expression);
            },
        }
    }
}

/* 
PS：上面的变量不用记忆，只是react组件在AST中的称呼。需要手撸babel插件时打开https://astexplorer.net/ 对照即可。

*/