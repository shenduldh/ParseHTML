export default function parseHTML(html) {
    html = html.trim();
    let last;
    let stack = [];
    let currentParent;
    let rootArray = [];

    while (html) {
        last = html;

        const result = confirmType(html);
        if (result.type === 'element') {
            if (clearTrash()) {
                continue
            }

            const endTagMatch = html.match(/^<\/\s*([a-zA-Z0-9]+)\s*>/);
            if (endTagMatch) {
                advance(endTagMatch[0].length);
                handleEndTag(endTagMatch[1]);
                continue
            }

            const startTagMatch = parseStartTag()
            if (startTagMatch) {
                handleStartTag(startTagMatch);
                continue
            }
        }

        if (result.type === 'text') {
            const text = html.substring(0, result.index);
            handleTextTag(text);
            advance(result.index);
        }

        if (last === html) {
            throw (new Error(html))
        }
    }

    return rootArray


    function confirmType() {
        const index = html.indexOf('<');
        const type = index === 0 ? 'element' : 'text'
        return { index, type }
    }

    function advance(index) {
        html = html.substring(index)
    }

    function clearTrash() {
        const doctypeMatch = html.match(/^<!DOCTYPE [^>]+>/i);
        if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            return true
        }

        if (/^<!--/.test(html)) {
            const commentEnd = html.indexOf('-->');
            if (commentEnd >= 0) {
                advance(commentEnd + 3);
                return true
            }
        }

        if (/^<!\[/.test(html)) {
            const conditionalEnd = html.indexOf(']>');
            if (conditionalEnd >= 0) {
                advance(conditionalEnd + 2);
                return true
            }
        }

        if (/^<meta/.test(html)) {
            const scriptEnd = html.indexOf('>');
            if (scriptEnd >= 0) {
                advance(scriptEnd + 1);
                return true
            }
        }

        if (/^<script/.test(html)) {
            const scriptEnd = html.indexOf('</script>');
            if (scriptEnd >= 0) {
                advance(scriptEnd + 9);
                return true
            }
        }

        // if (/^<style/.test(html)) {
        //     const scriptEnd = html.indexOf('</style>');
        //     if (scriptEnd >= 0) {
        //         advance(scriptEnd + 8);
        //         return true
        //     }
        // }
    }

    function parseStartTag() {
        const start = html.match(/^<([a-zA-Z0-9]+)/);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length);
            let end, attr;
            while (!(end = html.match(/^\s*(\/?)>/)) &&
                (attr = html.match(/^\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/))) {
                advance(attr[0].length);
                match.attrs.push(attr);
            }
            if (end) {
                match.selfClosing = end[1] === '/' ? true : false;
                advance(end[0].length);
                return match
            }
        }
    }


    function handleEndTag(match) {
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tagName === match) {
                stack.splice(i);
                currentParent = stack[stack.length - 1];
                break
            }
        }
    }

    function handleStartTag(match) {
        const attrs = createAttrs(match.attrs);
        let tag;
        if (currentParent) {
            tag = createTag(match.tagName, attrs, currentParent);
            currentParent.children.push(tag);
        } else {
            tag = createTag(match.tagName, attrs);
            rootArray.push(tag);
        }

        if (!match.selfClosing) {
            stack.push(tag);
            currentParent = tag;
        }
    }

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
