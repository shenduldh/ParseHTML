import parse from './parser.js'

const url = './example.html';
fetch(url).then(response => {
    console.log('get success!');
    return response.text()
}).then(text => {
    const root = parse(text)[0];
    let container = document.getElementById('root');
    show(root, container);
}).catch(error => {
    console.log(error)
})

function show(root, container) {
    if (typeof root === 'string') {
        container.innerText = root;
    } else {
        let el = document.createElement(root.tagName);

        if (root.attrs) {
            for (var attr in root.attrs) {
                el.setAttribute(attr, root.attrs[attr]);
            }
        }
        container.append(el);
        if (root.children) {
            root.children.forEach(child => {
                // 1s延迟
                setTimeout(() => { show(child, el); }, 1000)
            })
        }
    }
}
