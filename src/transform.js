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

        // Plain text present inside the JSX opening and closing element
        // eg: <button>Save</button>
        children.forEach((child) => {
            if(child.type === 'JSXText') {
                child.value = `${getReplacementString(child.value)}`;
            }
        });

        openingElement.attributes.forEach((attribute) => {
            const attributeValue = attribute.value;

            // attribute value is a plain string, this won't cover plain strings written inside {}
            // eg: <input placeholder="please enter your username" />
            if(attributeValue && attributeValue.type === 'Literal' && typeof attributeValue.value === 'string') {
                attribute.value = jscodeshift.literal(getReplacementString(attributeValue.value));
            }

            // attribute value is a string inside {}
            // eg: <input placeholder={"please enter your username"} />
            if(attributeValue && attributeValue.type === 'JSXExpressionContainer') {
                console.log("This is very very embarassing!!!");
                console.log(attributeValue.expression.type);
                console.log(attributeValue.expression.value);

                if(attributeValue.expression.type === 'Literal' && typeof attributeValue.expression.value === 'string') {
                    attributeValue.expression.value = getReplacementString(attributeValue.expression.value);
                }
            }
        });
    });


    // creating modified source code file using updated AST
    return root.toSource();

}




module.exports = transform;