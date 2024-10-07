const {
  isAttributeRenderable,
  createUseTransitionCall,
  checkAndAddTransitionImport,
  containsLink,
} = require("../utils");

const transform = (fileInfo, api, options) => {
  const { jscodeshift } = api;
  const root = jscodeshift(fileInfo.source);

  const transformOptionsArray = (array) => {
    array.forEach((item) => {
      if (item.label && typeof item.label === "string") {
        // Replace the label with createUseTransitionCall
        item.label = createUseTransitionCall(item.label);
      }
    });
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

      // Apply useTransition call on the string literals if they exist
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

//   root.find(jscodeshift.VariableDeclaration).forEach((path)=> {
//     if(path.node.init.type === 'ArrayExpression'){
//         if(path.node.)
//     }
//   })

  root.find(jscodeshift.JSXElement).forEach((path) => {
    const { children } = path.node;

    // Plain text present inside the JSX opening and closing element
    // eg: <button>Save</button>
    children.forEach((child, index) => {
      if (child.type === "JSXText") {
        const trimmedValue = child.value?.trim();

        if (trimmedValue) {
          // replacing label with createUseTransition() call
          path.node.children[index] = jscodeshift.jsxExpressionContainer(
            createUseTransitionCall(trimmedValue)
          );

          // add import for useTransition if not added already
          checkAndAddTransitionImport(root);
        }
      } else if (child.type === "JSXExpressionContainer") {
        if (child.expression.type === "TemplateLiteral") {
          const newExpressions = [];
          child.expression.quasis.forEach((expVal, index) => {
            const trimmedExpressionValue = expVal.value.raw.trim();
            if (trimmedExpressionValue) {
              // Push the useTransition call as an expression
              newExpressions.push(
                createUseTransitionCall(trimmedExpressionValue)
              );

              // Add import for useTransition if not added already
              checkAndAddTransitionImport(root);
            }

            if (child.expression.expressions[index]) {
              let expr = child.expression.expressions[index];
              if (expr.type === "ConditionalExpression") {
                expr = transformConditionalExpression(expr);
              }
              newExpressions.push(expr);
            }
          });

          // Replace the old template literal with the new expressions
          child.expression = jscodeshift.templateLiteral(
            newExpressions.map((exp, i) =>
              jscodeshift.templateElement(
                { raw: "", cooked: "" },
                i === newExpressions.length - 1
              )
            ),
            newExpressions
          );
        } else if (child.expression.type === "LogicalExpression") {
          const expression = child.expression;
          const leftVal =
            expression.left.type === "Literal"
              ? expression.left.value?.trim()
              : "";
          const rightVal =
            expression.right.type === "Literal"
              ? expression.right.value?.trim()
              : "";

          if (leftVal && !containsLink(leftVal)) {
            expression.left = jscodeshift.jsxExpressionContainer(
              createUseTransitionCall(leftVal)
            );
          }
          if (rightVal && !containsLink(rightVal)) {
            expression.right = jscodeshift.jsxExpressionContainer(
              createUseTransitionCall(rightVal)
            );
          }
        } else if (child.expression.type === "ConditionalExpression") {
          child.expression = transformConditionalExpression(child.expression);
        }
      }
    });
  });

  root.find(jscodeshift.JSXExpressionContainer).forEach((path) => {
    if (path.node.expression.type === "TemplateLiteral") {
      // Template literal logic
      const newExpressions = [];
      path.node.expression.quasis.forEach((expVal, index) => {
        const trimmedExpressionValue = expVal.value.raw.trim();
        if (trimmedExpressionValue) {
          newExpressions.push(createUseTransitionCall(trimmedExpressionValue));
          checkAndAddTransitionImport(root);
        }
        if (path.node.expression.expressions[index]) {
          let expr = path.node.expression.expressions[index];
          if (expr.type === "ConditionalExpression") {
            expr = transformConditionalExpression(expr);
          }
          newExpressions.push(expr);
        }
      });

      path.node.expression = jscodeshift.templateLiteral(
        newExpressions.map((exp, i) =>
          jscodeshift.templateElement(
            { raw: "", cooked: "" },
            i === newExpressions.length - 1
          )
        ),
        newExpressions
      );
    } else if (path.node.expression.type === "LogicalExpression") {
      const expression = path.node.expression;
      const leftVal =
        expression.left.type === "Literal" ? expression.left.value?.trim() : "";
      const rightVal =
        expression.right.type === "Literal"
          ? expression.right.value?.trim()
          : "";

      if (leftVal && !containsLink(leftVal)) {
        expression.left = jscodeshift.jsxExpressionContainer(
          createUseTransitionCall(leftVal)
        );
      }
      if (rightVal && !containsLink(rightVal)) {
        expression.right = jscodeshift.jsxExpressionContainer(
          createUseTransitionCall(rightVal)
        );
      }
    } else if (path.node.expression.type === "ConditionalExpression") {
      path.node.expression = transformConditionalExpression(
        path.node.expression
      );
    }
  });

  root.find(jscodeshift.JSXAttribute).forEach((path) => {
    const elementPath = path.parentPath.parentPath;
    const elementName = elementPath.node.name.name;
    const attrName = path.node.name.name;
    const attributeValue = path.node.value;

    // don't replace attribute string if it doesn't render on screen
    if (isAttributeRenderable(elementName, attrName)) {
      // attribute value is a plain string, this won't cover plain strings written inside {}
      // eg: <input placeholder="please enter your username" />
      if (
        attributeValue &&
        attributeValue.type === "Literal" &&
        typeof attributeValue.value === "string"
      ) {
        const trimmedAttributeValue = attributeValue.value?.trim();
        if (trimmedAttributeValue) {
          path.node.value = jscodeshift.jsxExpressionContainer(
            createUseTransitionCall(trimmedAttributeValue)
          );

          // add import for useTransition if not added already
          checkAndAddTransitionImport(root);
        }
      }

      // attribute value is a string inside {}
      // eg: <input placeholder={"please enter your username"} />
      if (attributeValue && attributeValue.type === "JSXExpressionContainer") {
        if (
          attributeValue.expression.type === "Literal" &&
          typeof attributeValue.expression.value === "string"
        ) {
          const trimmedExpressionValue =
            attributeValue.expression.value?.trim();
          if (trimmedExpressionValue) {
            attributeValue.expression.value = createUseTransitionCall(
              trimmedExpressionValue
            );

            // add import for useTransition if not added already
            checkAndAddTransitionImport(root);
          }
        }
      }
    }
  });

    root
    .find(jscodeshift.JSXElement)
    .forEach((path) => {
        // Finds the ObjectExpression nodes within the JSXElement to transform 'label' properties
        jscodeshift(path)
            .find(jscodeshift.ObjectExpression)
            .forEach((objectPath) => {
                const { properties } = objectPath.node;

                if (properties) {
                    processLabelProperty(properties, root);
                }
            });
    });

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
            });
    }
    
    // First part: Handling ObjectExpression inside menu attribute
    root.find(jscodeshift.JSXAttribute, { name: { name: "menu" } })
        .find(jscodeshift.ObjectExpression)
        .forEach(path => {
            const optionsProp = path.node.properties.find(prop => 
                prop.key && prop.key.name === 'options'
            );
    
            if (optionsProp && optionsProp.value.type === 'ObjectExpression') {
                const propsUnderObj = optionsProp.value.properties;
                const objectName = propsUnderObj[0].value.name;
    
                findAndProcessOptionsArray(objectName, root);
            }
        });
    
    // Second part: Handling JSX options attribute
    root.find(jscodeshift.JSXElement)
        .find(jscodeshift.JSXAttribute, { name: { name: 'options' } })
        .forEach((optionsAttrPath) => {
            const attributeValue = optionsAttrPath.node.value;
    
            // Ensure the value is a JSXExpressionContainer
            if (attributeValue && attributeValue.type === 'JSXExpressionContainer' && attributeValue.expression) {
                const objectName = attributeValue.expression.name;
    
                findAndProcessOptionsArray(objectName, root);
            }
        });

  // creating modified source code file using updated AST
  return root.toSource();
};

module.exports = transform;
