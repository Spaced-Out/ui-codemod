const jscodeshift = require("jscodeshift");
const { RENDER_ATTRS, RENDER_ATTRS_BY_TAG, USE_TRANSITION_IMPORT_PATH } = require("../constants/index");

// returns if an attribute's value is rendered on screen
const isAttributeRenderable = (tag, attribute) => {
    if(RENDER_ATTRS[attribute] === true || (
        RENDER_ATTRS_BY_TAG[tag] && RENDER_ATTRS_BY_TAG[tag][attribute] === true
    )) {
        return true;
    }
    else {
        return false;
    }
}

// returns small subtree representing a call to useTransition function
const createUseTransitionCall = (label) => {
    return jscodeshift.callExpression(
        jscodeshift.identifier('useTransition'),
        [
            jscodeshift.literal(getTranslationLabel(label)),
            jscodeshift.literal(label)
        ]
    );
}

// returns translation label for an extracted label
const getTranslationLabel = (label) => {
    return label.split(" ").map((label) => label.toUpperCase()).join("_");
}

// Adds `import { useTransition } from 'src/hooks/usei18n';` in the file that is getting processed
const checkAndAddTransitionImport = (root) => {
    // Add the `useTransition` import if it doesn't exist
    const isImportPresent = root.find(jscodeshift.ImportDeclaration, {
        source: { value: USE_TRANSITION_IMPORT_PATH },
    }).size() > 0;

    if(!isImportPresent) {
        const useTransitionImport = jscodeshift.importDeclaration(
            [jscodeshift.importSpecifier(jscodeshift.identifier('useTransition'))],
            jscodeshift.literal(USE_TRANSITION_IMPORT_PATH)
        );
        root.get().node.program.body.unshift(useTransitionImport);
    }
}

// returns if a variable declaration has "string" value
const isVariableString = (variableName, scope) => {
    const binding = scope.getBindings()[variableName];

    if(binding && binding.length > 0) {
        const declaration = binding[0].parentPath;

        if(
            declaration.node.init && 
            declaration.node.type === 'VariableDeclarator' &&
            declaration.node.init.type === 'Literal' && 
            typeof declaration.node.init.value === 'string'
        ) {
            return true;
        }
    }
    return false;
}

module.exports = {
    isAttributeRenderable,
    createUseTransitionCall,
    getTranslationLabel,
    checkAndAddTransitionImport,
    isVariableString
}