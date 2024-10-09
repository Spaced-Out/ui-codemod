const jscodeshift = require("jscodeshift");
const {
  RENDER_ATTRS,
  RENDER_ATTRS_BY_TAG,
  USE_I18N_IMPORT_PATH,
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
const containsLink = (text)=> {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return urlPattern.test(text);
}

// returns small subtree representing a call to 't' function
const createUseTransitionCall = (label) => {
  return jscodeshift.callExpression(jscodeshift.identifier("t"), [
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

// adds `import { useI18n } from 'src/hooks/usei18n';` in the file that is getting processed
const checkAndAddI18nImport = (root) => {
  // Add the `useI18n` import if it doesn't exist
  const isImportPresent =
    root
      .find(jscodeshift.ImportDeclaration, {
        source: { value: USE_I18N_IMPORT_PATH },
      })
      .size() > 0;

  if (!isImportPresent) {
    const useI18nImport = jscodeshift.importDeclaration(
      [jscodeshift.importSpecifier(jscodeshift.identifier("useI18n"))],
      jscodeshift.literal(USE_I18N_IMPORT_PATH)
    );
    const topElem = root.get().node.program.body.shift(); // for `@flow strict`
    root.get().node.program.body.unshift(useI18nImport);
    root.get().node.program.body.unshift(topElem);
  }
};

// check if the component contains static string literals (inside JSX)
const hasStaticStringLiterals = (path) => {
  const jsxElements = jscodeshift(path).find(jscodeshift.JSXElement);

  return jsxElements.some((jsxPath) => {
    const hasStaticText = jscodeshift(jsxPath)
      .find(jscodeshift.JSXText)
      .some((textPath) => textPath.node.value.trim().length > 0);

    const hasStaticInAttributes = jscodeshift(jsxPath)
      .find(jscodeshift.JSXAttribute)
      .some((attrPath) => {
        const value = attrPath.node.value;
        const elementPath = attrPath.parentPath.parentPath;
        const elementName = elementPath.node.name.name;
        const attrName = attrPath.node.name.name;
        const attributeValue = path.node.value;
        return (
          isAttributeRenderable(elementName, attrName) &&
          value &&
          value.type === "Literal" &&
          typeof value.value === "string" &&
          value.value.length > 0
        );
      });

    return hasStaticText || hasStaticInAttributes;
  });
};

// handles component types (arrow functions and function declarations)
const checkAndAddI18nInstance = (root) => {
  // Handle components declared as arrow functions
  root.find(jscodeshift.VariableDeclaration).forEach((path) => {
    const declarations = path.node.declarations;
    declarations.forEach((declaration) => {
      if (
        declaration.init &&
        declaration.init.type === "ArrowFunctionExpression"
      ) {
        const componentBody = declaration.init.body;

        // if the component contains static labels, add i18n instance
        if (hasStaticStringLiterals(path)) {
          addI18nInstanceIfNeeded(componentBody);
        }
      }
    });
  });

  // handle components declared using function declarations
  root.find(jscodeshift.FunctionDeclaration).forEach((path) => {
    const componentBody = path.node.body;

    if (hasStaticStringLiterals(path)) {
      addI18nInstanceIfNeeded(componentBody);
    }
  });
};

// adds the i18n instance if not present
const addI18nInstanceIfNeeded = (componentBody) => {
  const bodyStatements = componentBody.body;

  // check if either variable already exists
  const hasLabelI18nInstance = bodyStatements.some(
    (statement) =>
      statement.type === "VariableDeclaration" &&
      statement.declarations.some(
        (decl) => decl.id.name === "labelI18nInstance"
      )
  );

  const hasTAssignment = bodyStatements.some(
    (statement) =>
      statement.type === "VariableDeclaration" &&
      statement.declarations.some((decl) => decl.id.name === "t")
  );

  // only add the i18n lines if they don't exist already
  if (!hasLabelI18nInstance) {
    const labelI18nInstanceStatement = jscodeshift.variableDeclaration(
      "const",
      [
        jscodeshift.variableDeclarator(
          jscodeshift.identifier("labelI18nInstance"),
          jscodeshift.callExpression(jscodeshift.identifier("useI18n"), [])
        ),
      ]
    );
    bodyStatements.unshift(labelI18nInstanceStatement);
  }

  if (!hasTAssignment) {
    const tStatement = jscodeshift.variableDeclaration("const", [
      jscodeshift.variableDeclarator(
        jscodeshift.identifier("t"),
        jscodeshift.memberExpression(
          jscodeshift.identifier("labelI18nInstance"),
          jscodeshift.identifier("t")
        )
      ),
    ]);
    const labelInstanceStatement = bodyStatements.shift();
    bodyStatements.unshift(tStatement);
    bodyStatements.unshift(labelInstanceStatement);
  }
};

// returns if a variable declaration has "string" value
// const isVariableString = (variableName, scope) => {
//   const binding = scope.getBindings()[variableName];

//   if (binding && binding.length > 0) {
//     const declaration = binding[0].parentPath;

//     if (
//       declaration.node.init &&
//       declaration.node.type === "VariableDeclarator" &&
//       declaration.node.init.type === "Literal" &&
//       typeof declaration.node.init.value === "string"
//     ) {
//       return true;
//     }
//   }
//   return false;
// };

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

  // based on the object name, finding the variable if label exists, change it
  const findAndProcessOptionsArray=(objectName, root)=>{
    // find the object with the same name as the options attribute's expression
    root
        .find(jscodeshift.VariableDeclarator, { id: { name: objectName } })
        .forEach((variablePath) => {
            // ensure that the variable has an init property
            if (variablePath.node.init && variablePath.node.init.type === 'ArrayExpression') {
                const { elements } = variablePath.node.init;

                elements.forEach((element) => {
                    // check if the element is an ObjectExpression
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
const processLabelProperty=(properties, root)=> {
  properties.forEach((property) => {
      // check if the property contains the 'label' key and it's a literal string
      if (property.key && property.key.name === 'label' && property.value.type === 'Literal') {
          const labelValue = property.value.value.trim();

          if (labelValue) {
              // apply the translation only to labels in the values array
              property.value = createUseTransitionCall(labelValue);
              checkAndAddI18nImport(root);
              checkAndAddI18nInstance(root);
          }
      }
  });
}


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

const transformConditionalExpression = (expression) => {
    if (expression.type === "ConditionalExpression") {
      const consequentVal =
        expression.consequent.type === "Literal" &&
        typeof expression.consequent.value === "string"
          ? expression.consequent.value.trim()
          : null;
      const alternateVal =
        expression.alternate.type === "Literal" &&
        typeof expression.alternate.value === "string"
          ? expression.alternate.value.trim()
          : null;

      // If the consequent or alternate is another conditional expression, recursively handle it
      if (expression.consequent.type === "ConditionalExpression") {
        expression.consequent = transformConditionalExpression(
          expression.consequent
        );
      }
      if (expression.alternate.type === "ConditionalExpression") {
        expression.alternate = transformConditionalExpression(
          expression.alternate
        );
      }

      // Apply useI18n call on the string literals if they exist
      if (consequentVal && !containsLink(consequentVal)) {
        expression.consequent = jscodeshift.jsxExpressionContainer(
          createUseTransitionCall(consequentVal)
        );
      }
      if (alternateVal && !containsLink(alternateVal)) {
        expression.alternate = jscodeshift.jsxExpressionContainer(
          createUseTransitionCall(alternateVal)
        );
      }
    }

    return expression;
  };

module.exports = {
  isAttributeRenderable,
  createUseTransitionCall,
  getTranslationLabel,
  checkAndAddI18nImport,
  checkAndAddI18nInstance,
  isVariableInitializedWithString,
  containsLink,
  processLabelProperty,
  findAndProcessOptionsArray,
  transformConditionalExpression,
};
