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
    .map((label) => label.toUpperCase())
    .join("_");
};

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
const isVariableString = (variableName, scope) => {
  const binding = scope.getBindings()[variableName];

  if (binding && binding.length > 0) {
    const declaration = binding[0].parentPath;

    if (
      declaration.node.init &&
      declaration.node.type === "VariableDeclarator" &&
      declaration.node.init.type === "Literal" &&
      typeof declaration.node.init.value === "string"
    ) {
      return true;
    }
  }
  return false;
};

  // based on the object name, finding the variable if label exists changes it
  function findAndProcessOptionsArray(objectName, root) {
    // Find the object with the same name as the options attribute's expression
    root
        .find(jscodeshift.VariableDeclarator, { id: { name: objectName } })
        .forEach((variablePath) => {
            // Ensure that the variable has an init property
            if (variablePath.node.init && variablePath.node.init.type === 'ArrayExpression') {
                const { elements } = variablePath.node.init;

                elements.forEach((element) => {
                    // Check if the element is an ObjectExpression
                    if (element.type === 'ObjectExpression') {
                        const { properties } = element;

                        if (properties) {
                            processLabelProperty(properties, root);
                        }
                    }
                });
            }
            else if (variablePath.node.init.type === 'ObjectExpression')
            {
                const { properties } = variablePath.node.init;
                processLabelProperty(properties, root);
            }
    });
}

// process the label for the passed properties
function processLabelProperty(properties, root) {
  properties.forEach((property) => {
      // Check if the property contains the 'label' key and it's a literal string
      if (property.key && property.key.name === 'label' && property.value.type === 'Literal') {
          const labelValue = property.value.value.trim();

          if (labelValue) {
              // Apply the translation only to labels in the values array
              property.value = createUseTransitionCall(labelValue);
              checkAndAddTransitionImport(root);
          }
      }
  });
}

module.exports = {
  isAttributeRenderable,
  createUseTransitionCall,
  getTranslationLabel,
  checkAndAddTransitionImport,
  isVariableString,
  containsLink,
  processLabelProperty,
  findAndProcessOptionsArray
};
