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
function containsLink(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return urlPattern.test(text);
}

const extractLabelAndSpecialChars = (str) => {
  // Initialize an empty string for the label
  let newLabel = '';
  let leadingSpecial = '';
  let trailingSpecial = '';

  // Extract leading special characters
  while (str.length > 0 && (/[^A-Za-z0-9]/).test(str[0])) {
      leadingSpecial += str[0];
      str = str.slice(1);
  }

  // The remaining string now contains the alphanumeric label
  newLabel = str;

  // Extract trailing special characters
  while (newLabel.length > 0 && (/[^A-Za-z0-9]/).test(newLabel[newLabel.length - 1])) {
      trailingSpecial = newLabel[newLabel.length - 1] + trailingSpecial;
      newLabel = newLabel.slice(0, -1);
  }

  return { leadingSpecial, newLabel, trailingSpecial }; // Return the special characters and label
}

const splitStringByCharacterType = (inputLine) => {
  const substrings = [];
  let currentSubstring = '';
  let isPreviousCharacterAlpha = true;

  for (let i = 0; i < inputLine.length; i++) {
      const currentChar = inputLine.charAt(i);
      const currentCharLower = currentChar.toLowerCase();
      const isCurrentCharacterAlpha = currentCharLower >= 'a' && currentCharLower <= 'z';

      if (isCurrentCharacterAlpha === isPreviousCharacterAlpha) {
          currentSubstring += currentChar;
      } else {
          substrings.push(currentSubstring);
          currentSubstring = currentChar;
          isPreviousCharacterAlpha = isCurrentCharacterAlpha;
      }
  }

  // Handle the last substring
  if (currentSubstring.length !== 0) {
    substrings.push(currentSubstring);
  }

  const isAlphaStartArray = new Array(substrings.length).fill(false);

  for (let i = 0; i < substrings.length; i++) {
      const substring = substrings[i];

      if (substring.charAt(0).toLowerCase() >= 'a' && substring.charAt(0).toLowerCase() <= 'z') {
          isAlphaStartArray[i] = true;
          continue;
      } 
      else {
          let containsOnlySpaces = true;
          for (let k = 0; k < substring.length; k++) {
              const char = substring.charAt(k);
              if (char !== ' ') {
                  containsOnlySpaces = false;
                  break;
              }
          }
          isAlphaStartArray[i] = containsOnlySpaces;
      }
  }

  const finalResult = [];
  currentSubstring = '';

  for (let i = 0; i < substrings.length; i++) {
      const substring = substrings[i];
      if (isAlphaStartArray[i]) {
          currentSubstring += substring;
      } else {
          finalResult.push(currentSubstring);
          finalResult.push(substring);
          currentSubstring = '';
      }
  }

  if (currentSubstring.length !== 0) {
    finalResult.push(currentSubstring);
  }

  return finalResult;
}

const createUseTransitionCall = (rawLabel) => {

    const { leadingSpecial, newLabel, trailingSpecial } = extractLabelAndSpecialChars(rawLabel);
    const segments = splitStringByCharacterType(newLabel);
    const quasis = [];
    const expressions = [];
    
    let isQuasi = true; // Track whether we're adding a quasi or expression
    
    if (leadingSpecial) {
        quasis.push(jscodeshift.templateElement({ raw: leadingSpecial, cooked: leadingSpecial },  false ));
        isQuasi = false;
    }

    segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;

        // If segment is non-alphabetical, it's a quasi
        if (/^[^a-zA-Z]+$/.test(segment)) {
            quasis.push(jscodeshift.templateElement( { raw: segment, cooked: segment }, false ));
            // Only true if this is the last segment and we're ending with a quasi
            isQuasi = false;
        } else {
            // For text segments that need translation
            const translationLabel = getTranslationLabel(segment.trim());
            
            // Add empty quasi before expression if needed
            if (isQuasi) {
                quasis.push(jscodeshift.templateElement( { raw: '', cooked: '' }, false ));
            }
            
            expressions.push(
                        jscodeshift.callExpression(jscodeshift.identifier("t"),[
                        jscodeshift.literal(translationLabel),
                        jscodeshift.literal(segment.trim())
                    ]
                )
            );
            isQuasi = true;
        }
    });

    if (trailingSpecial) {
      quasis.push(jscodeshift.templateElement({ raw: trailingSpecial, cooked: trailingSpecial }, false ));
    }

    if (isQuasi) {
        quasis.push(jscodeshift.templateElement({ raw: '', cooked: '' }, true ));
    }

    return jscodeshift.templateLiteral(quasis, expressions);  
};

// returns translation label for an extracted label
const getTranslationLabel = (label) => {
  return label
      .split(" ")
      //replace special characters from string
      .map((label) => label.toUpperCase().replace(/[^A-Z0-9\s]/g, ""))
      .join("_");
}

// Adds `import { useI18n } from 'src/hooks/usei18n';` in the file that is getting processed
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

// Check if the component contains static string literals (inside JSX)
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

// Handles component types (arrow functions and function declarations)
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

        // If the component contains static labels, add i18n instance
        if (hasStaticStringLiterals(path)) {
          addI18nInstanceIfNeeded(componentBody);
        }
      }
    });
  });

  // Handle components declared using function declarations
  root.find(jscodeshift.FunctionDeclaration).forEach((path) => {
    const componentBody = path.node.body;

    // If the component contains static labels, add i18n instance
    if (hasStaticStringLiterals(path)) {
      addI18nInstanceIfNeeded(componentBody);
    }
  });
};

// Adds the i18n instance if not present
const addI18nInstanceIfNeeded = (componentBody) => {
  const bodyStatements = componentBody.body;

  // Check if either variable already exists
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

  // Only add the i18n lines if they don't exist already
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
          return true;
      case 'BinaryExpression':
          return init.operator === '+' && 
                 (isStringExpression(j)(init.left) || isStringExpression(j)(init.right));
      default:
          return false;
  }
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

// return if variable declaration has "Array" value
const isVariableInitializedWithArray = (j)=>(path) => {
    const init = path.node.init;   
    if (!init) {   
        return false;
    }
    if (init.type === 'ArrayExpression') {
        return true; 
    }
    return false;
};

module.exports = {
  isAttributeRenderable,
  createUseTransitionCall,
  getTranslationLabel,
  checkAndAddI18nImport,
  checkAndAddI18nInstance,
  isVariableInitializedWithString,
  isVariableInitializedWithArray,
  containsLink,
  processLabelProperty,
  findAndProcessOptionsArray
};
