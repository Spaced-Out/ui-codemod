const jscodeshift = require("jscodeshift");

// string would cause a problem, will use builders to create a proper function call expression with the extracted label as an arugment
const getReplacementString = (label) => {
    return `useTransition(${label})`;
}


const transform = (fileInfo, api, options) => {

    const { jscodeshift } = api;
    const root = jscodeshift(fileInfo.source);

    root
    .find(jscodeshift.JSXElement)
    .forEach((path) => {
        const { openingElement, children} = path.node;

        children.forEach((child) => {
            if(child.type === 'JSXText') {
                child.value = `${getReplacementString(child.value)}`;
            }
        });

    });


    // creating modified source code file using updated AST
    return root.toSource();

}




module.exports = transform;