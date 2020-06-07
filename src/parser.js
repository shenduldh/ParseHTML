function parseHTML(html) {
    html = html.trim(); // 简单预处理
    let last; // 用于存放剩余HTML
    let stack = []; // 处理层次
    let currentParent; // 当前解析标签的父标签
    let rootArray = []; // 存放根标签

    // 循环处理html，一次处理1个标签：
    //  1.元素标签（包括开始标签、结束标签）
    //  2.文本标签
    while (html) {
        // 保存上一次处理后的结果，判断是否进入死循环
        last = html;

        // 判断标签类型
        const result = confirmType(html);
        // 如果是元素标签
        if (result.type === 'element') {
            // 清理无用标签
            if (clearTrash()) {
                continue
            }
            // 如果是结束标签，将标签踢出栈
            const endTagMatch = html.match(/^<\/\s*([a-zA-Z0-9]+)\s*>/); // 匹配结束标签
            if (endTagMatch) {
                advance(endTagMatch[0].length);
                handleEndTag(endTagMatch[1]); // 处理结束标签
                continue
            }
            // 如果是开始标签，收集属性，将标签压入栈中并判断标签层次
            const startTagMatch = parseStartTag() // 解析开始标签，提取有用信息(属性)
            if (startTagMatch) {
                handleStartTag(startTagMatch); // 处理开始标签
                continue
            }
        }

        // 如果是文本标签，收集文本，直接判断标签层次
        if (result.type === 'text') {
            const text = html.substring(0, result.index);
            handleTextTag(text); // 处理文本标签
            advance(result.index);
        }

        // 如果解析前后html没有变化，则终止解析
        if (last === html) {
            throw (new Error(html))
        }
    }

    return rootArray

    // --------------------------用于解析的相关函数-------------------------------------

    // 确认标签类型（文本、元素）
    function confirmType() {
        const index = html.indexOf('<');
        const type = index === 0 ? 'element' : 'text'
        return { index, type }
    }

    // 移动游标，删除已解析内容
    function advance(index) {
        html = html.substring(index)
    }

    // 清除无用信息：文档声明、注释、头标签（除标题标签外）
    function clearTrash() {
        // 文档声明
        const doctypeMatch = html.match(/^<!DOCTYPE [^>]+>/i);
        if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            return true
        }

        // 注释
        if (/^<!--/.test(html)) {
            const commentEnd = html.indexOf('-->');
            if (commentEnd >= 0) {
                advance(commentEnd + 3);
                return true
            }
        }

        // 条件注释
        if (/^<!\[/.test(html)) {
            const conditionalEnd = html.indexOf(']>');
            if (conditionalEnd >= 0) {
                advance(conditionalEnd + 2);
                return true
            }
        }

        // 元标签
        if (/^<meta/.test(html)) {
            const scriptEnd = html.indexOf('>');
            if (scriptEnd >= 0) {
                advance(scriptEnd + 1);
                return true
            }
        }

        // 脚本
        if (/^<script/.test(html)) {
            const scriptEnd = html.indexOf('</script>');
            if (scriptEnd >= 0) {
                advance(scriptEnd + 9);
                return true
            }
        }

        // style标签
        if (/^<style/.test(html)) {
            const scriptEnd = html.indexOf('</style>');
            if (scriptEnd >= 0) {
                advance(scriptEnd + 8);
                return true
            }
        }
    }

    // 解析开始标签，从开始标签中提取有用信息
    function parseStartTag() {
        const start = html.match(/^<([a-zA-Z0-9]+)/);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length);
            // 提取属性
            let end, attr;
            while (!(end = html.match(/^\s*(\/?)>/)) &&
                (attr = html.match(/^\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/))) {
                advance(attr[0].length);
                match.attrs.push(attr);
            }
            // 判断是否自闭合
            if (end) {
                match.selfClosing = end[1] === '/' ? true : false;
                advance(end[0].length);
                return match
            }
        }
    }

    //-----------------------------生成html树---------------------------------

    // 从stack中移除已经解析完的标签，并设置父标签
    function handleEndTag(match) {
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tagName === match) {
                stack.splice(i);
                currentParent = stack[stack.length - 1];
                break
            }
        }
    }

    // 处理开始标签，处理各个标签间的层次结构，形成树
    function handleStartTag(match) {
        // 创建标签
        const attrs = createAttrs(match.attrs);
        let tag;
        if (currentParent) { // 判断当前的标签有没有父标签，如果有
            tag = createTag(match.tagName, attrs, currentParent);
            currentParent.children.push(tag);
        } else { // 如果没有，那么就是根标签
            tag = createTag(match.tagName, attrs);
            rootArray.push(tag);
        }

        // 如果不是自闭合标签
        if (!match.selfClosing) {
            stack.push(tag);
            // 将当前标签作为下一个标签的父标签
            currentParent = tag;
        }
    }

    // 处理文本标签
    function handleTextTag(match) {
        const text = match.replace(/&nbsp;/g, '').trim();
        if (text !== '') {
            currentParent.children.push(text);
        }
    }

    function createTag(tagName, attrs, parent = null, children = []) {
        return {
            tagName: tagName,
            attrs: attrs,
            parent: parent,
            children: children
        }
    }

    function createAttrs(attrs) {
        if (attrs.length === 0) {
            return null
        } else {
            let obj = {};
            attrs.forEach(attr => {
                obj[attr[1]] = attr[2] || attr[3] || attr[4] || '';
            });
            return obj
        }
    }
}
