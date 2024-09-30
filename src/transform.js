const { isAttributeRenderable, createUseTransitionCall } = require("./utils");

const transform = (fileInfo, api, options) => {

    const { jscodeshift } = api;
    const root = jscodeshift(fileInfo.source);

    root
    .find(jscodeshift.JSXElement)
    .forEach((path) => {
        const { children} = path.node;

        // Plain text present inside the JSX opening and closing element
        // eg: <button>Save</button>
        children.forEach((child, index) => {
            if(child.type === 'JSXText') {
                const trimmedValue = child.value.trim();

                if(trimmedValue) {
                    // replacing label with createUseTransition() call
                    path.node.children[index] = jscodeshift.jsxExpressionContainer(createUseTransitionCall(jscodeshift, trimmedValue));
                }
            }
        });
    });


    root
    .find(jscodeshift.JSXAttribute)
    .forEach((path) => {

        const elementPath = path.parentPath.parentPath;
        const elementName = elementPath.node.name.name;
        const attrName = path.node.name.name;
        const attributeValue = path.node.value;


        // don't replace attribute string if it doesn't render on screen
        if(isAttributeRenderable(elementName, attrName)) {
            // attribute value is a plain string, this won't cover plain strings written inside {}
            // eg: <input placeholder="please enter your username" />
            if(attributeValue && attributeValue.type === 'Literal' && typeof attributeValue.value === 'string') {
                const trimmedAttributeValue = attributeValue.value.trim();
                if(trimmedAttributeValue) {
                    path.node.value = jscodeshift.jsxExpressionContainer(createUseTransitionCall(jscodeshift, trimmedAttributeValue));
                }
            }

            // attribute value is a string inside {}
            // eg: <input placeholder={"please enter your username"} />
            if(attributeValue && attributeValue.type === 'JSXExpressionContainer') {

                if(attributeValue.expression.type === 'Literal' && typeof attributeValue.expression.value === 'string') {
                    const trimmedExpressionValue = attributeValue.expression.value.trim();
                    if(trimmedExpressionValue) {
                        attributeValue.expression.value = createUseTransitionCall(jscodeshift, trimmedExpressionValue);
                    }

                }
            }
        }
    })


    // creating modified source code file using updated AST
    return root.toSource();

}




module.exports = transform;