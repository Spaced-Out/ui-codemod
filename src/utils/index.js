const jscodeshift = require("jscodeshift");
const {
  RENDER_ATTRS,
  RENDER_ATTRS_BY_TAG,
  USE_TRANSITION_IMPORT_PATH,
} = require("../constants/index");

// returns if an attribute's value is rendered on screen
const isAttributeRenderable = (tag, attribute) => {
  if (
    RENDER_ATTRS[attribute] === true ||
    (RENDER_ATTRS_BY_TAG[tag] && RENDER_ATTRS_BY_TAG[tag][attribute] === true)
  ) {
    return true;
  } else {
    return false;
  }
};

// returns true if text is a link
function containsLink(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return urlPattern.test(text);
  }
  

// returns small subtree representing a call to useTransition function
const createUseTransitionCall = (label) => {
  return jscodeshift.callExpression(jscodeshift.identifier("useTransition"), [
    jscodeshift.literal(getTranslationLabel(label)),
    jscodeshift.literal(label),
  ]);
};

// returns translation label for an extracted label
const getTranslationLabel = (label) => {
    return label
        .split(" ")
        //replace special characters from string
        .map((label) => label.toUpperCase().replace(/[^A-Z0-9\s]/g, ""))
        .join("_");
}

// Adds `import { useTransition } from 'src/hooks/usei18n';` in the file that is getting processed
const checkAndAddTransitionImport = (root) => {
  // Add the `useTransition` import if it doesn't exist
  const isImportPresent =
    root
      .find(jscodeshift.ImportDeclaration, {
        source: { value: USE_TRANSITION_IMPORT_PATH },
      })
      .size() > 0;

  if (!isImportPresent) {
    const useTransitionImport = jscodeshift.importDeclaration(
      [jscodeshift.importSpecifier(jscodeshift.identifier("useTransition"))],
      jscodeshift.literal(USE_TRANSITION_IMPORT_PATH)
    );
    root.get().node.program.body.unshift(useTransitionImport);
  }
};

// returns if a variable declaration has "string" value
// const isVariableString = (variableName, scope) => {
//     const binding = scope.getBindings()[variableName];

//     if(binding && binding.length > 0) {
//         const declaration = binding[0].parentPath;

//         if(
//             declaration.node.init && 
//             declaration.node.type === 'VariableDeclarator' &&
//             declaration.node.init.type === 'Literal' && 
//             typeof declaration.node.init.value === 'string'
//         ) {
//             return true;
//         }
//     }
//     return false;
// }


//returns if a variable declaration has "string" value
const isVariableInitializedWithString = (j) => (path) => {
    const init = path.node.init;
    if (!init) return false;

    switch (init.type) {
        case 'StringLiteral':
            return true;
        case 'Literal':
            return typeof init.value === 'string';
        case 'TemplateLiteral':
            return init.expressions.length === 0;
        case 'BinaryExpression':
            return init.operator === '+' && 
                   (isStringExpression(j)(init.left) || isStringExpression(j)(init.right));
        default:
            return false;
    }
};



// return if variable declaration has "Array" value
// const isVariableInitializedWithArray = (j)=>(path) => {
//     const init = path.node.init;   
//     if (!init) {   
//         return false;
//     }
//     if (init.type === 'ArrayExpression') {
//         return true; 
//     }
//     return false;
// };


// helper function
const isStringExpression = (j) => (node) => {
    switch (node.type) {
        case 'StringLiteral':
        case 'TemplateLiteral':
            return true;
        case 'Literal':
            return typeof node.value === 'string';
        case 'BinaryExpression':
            return node.operator === '+' && 
                   (isStringExpression(j)(node.left) || isStringExpression(j)(node.right));
        default:
            return false;
    }
};




module.exports = {
    isAttributeRenderable,
    createUseTransitionCall,
    getTranslationLabel,
    checkAndAddTransitionImport,
    isVariableInitializedWithString,
    containsLink
}