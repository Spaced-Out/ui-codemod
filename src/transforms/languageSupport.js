const {
  isAttributeRenderable,
  createUseTransitionCall,
  checkAndAddI18nImport,
  checkAndAddI18nInstance,
  containsLink,
  processLabelProperty,
  findAndProcessOptionsArray,
  isVariableInitializedWithString,
  isVariableInitializedWithArray,
  transformConditionalExpression,
} = require("../utils");

const transform = (fileInfo, api, options) => {
  const { jscodeshift } = api;
  const root = jscodeshift(fileInfo.source);

  root.find(jscodeshift.JSXElement).forEach((path) => {
    const { children } = path.node;

    // plain text present inside the JSX opening and closing element
    // eg: <button>Save</button>
    children.forEach((child, index) => {
      if (child.type === "JSXText") {
        const trimmedValue = child.value?.trim();

        if (trimmedValue) {
          // replacing label with createUseTransition() call
          path.node.children[index] = jscodeshift.jsxExpressionContainer(
            createUseTransitionCall(trimmedValue)
          );

          // add import for useI18n if not added already
          checkAndAddI18nImport(root);
          // add extraction steps for 't' function if not added already
          checkAndAddI18nInstance(root);
        }
      } else if (child.type === "JSXExpressionContainer") {
        if (child.expression.type === "TemplateLiteral") {
          const newExpressions = [];
          child.expression.quasis.forEach((expVal, index) => {
            const trimmedExpressionValue = expVal.value.raw.trim();
            if (trimmedExpressionValue) {
              // push the useI18n call as an expression
              newExpressions.push(
                createUseTransitionCall(trimmedExpressionValue)
              );
              checkAndAddI18nImport(root);
              checkAndAddI18nInstance(root);
            }

            if (child.expression.expressions[index]) {
              let expr = child.expression.expressions[index];
              if (expr.type === "ConditionalExpression") {
                // this function is to handle nested conditional expressions
                expr = transformConditionalExpression(expr);
              }
              newExpressions.push(expr);
            }
          });

          // replace the old template literal with the new expressions
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
      const newExpressions = [];
      path.node.expression.quasis.forEach((expVal, index) => {
        const trimmedExpressionValue = expVal.value.raw.trim();
        if (trimmedExpressionValue) {
          newExpressions.push(createUseTransitionCall(trimmedExpressionValue));
          checkAndAddI18nImport(root);
          checkAndAddI18nInstance(root);
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

  // check if the variable is visibly used in JSX (not just used but actually rendered)
  const isVariableVisibleInUI = (j, root, variableName) => {
    return root
      .find(j.JSXExpressionContainer)
      .filter((path) => {
        // ensure the JSXExpression is part of a visible tag (not a fragment, etc.)
        const parent = path.parentPath;
        if (parent.node.type === "JSXElement") {
          const openingElement = parent.node.openingElement;
          if (openingElement) {
            return true;
          }
        }
        return false;
      })
      .some((path) => {
        // find if the variable (Identifier) is used inside this JSXExpression
        return j(path)
          .find(j.Identifier)
          .some((id) => id.node.name === variableName);
      });
  };

  // replace the variable array which we are using in jsx
  root
    .find(jscodeshift.VariableDeclarator)
    .filter(isVariableInitializedWithArray(jscodeshift))
    .forEach((path) => {
      const variableName = path.node.id.name;
      const init = path.node.init;

      if (
        init.type === "ArrayExpression" &&
        isVariableVisibleInUI(jscodeshift, root, variableName)
      ) {
        const elements = init.elements;

        if (elements.length > 0) {
          const transformedElements = elements
            .filter(
              (element) =>
                element.type === "Literal" || element.type === "StringLiteral"
            )
            .map((element) => {
              const trimmedValue = element.value.trim();
              return trimmedValue
                ? createUseTransitionCall(trimmedValue)
                : null;
            })
            .filter(Boolean);

          if (transformedElements.length > 0) {
            path.node.init = jscodeshift.arrayExpression(transformedElements);
            checkAndAddI18nImport(root);
            checkAndAddI18nInstance(root);
          }
        }
      }
    });

  // replace the variable string which we are using in jsx
  root
    .find(jscodeshift.VariableDeclarator)
    .filter(isVariableInitializedWithString(jscodeshift))
    .forEach((path) => {
      const variableName = path.node.id.name;
      const init = path.node.init;

      if (
        (init.type === "StringLiteral" ||
          (init.type === "Literal" && typeof init.value === "string")) &&
        isVariableVisibleInUI(jscodeshift, root, variableName)
      ) {
        const trimmedValue = init.value.trim();
        if (trimmedValue) {
          // replace the initializer with createUseTransition() call
          path.node.init = createUseTransitionCall(trimmedValue);
          checkAndAddI18nImport(root);
          checkAndAddI18nInstance(root);
        }
      } else if (
        init.type === "TemplateLiteral" &&
        isVariableVisibleInUI(jscodeshift, root, variableName)
      ) {
        const newExpressions = [];
        path.node.init.quasis.forEach((expVal, index) => {
          const trimmedExpressionValue = expVal.value.raw.trim();
          if (trimmedExpressionValue) {
            newExpressions.push(
              createUseTransitionCall(trimmedExpressionValue)
            );
            checkAndAddI18nImport(root);
            checkAndAddI18nInstance(root);
          }
          if (path.node.init.expressions[index]) {
            let expr = path.node.init.expressions[index];
            if (expr.type === "ConditionalExpression") {
              expr = transformConditionalExpression(expr);
            }
            newExpressions.push(expr);
          }
        });

        path.node.init = jscodeshift.templateLiteral(
          newExpressions.map((exp, i) =>
            jscodeshift.templateElement(
              { raw: "", cooked: "" },
              i === newExpressions.length - 1
            )
          ),
          newExpressions
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

          checkAndAddI18nImport(root);
          checkAndAddI18nInstance(root);
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

            checkAndAddI18nImport(root);
            checkAndAddI18nInstance(root);
          }
        }
      }
    }
  });

  // finds the ObjectExpression nodes within the JSXElement to transform 'label' properties
  root.find(jscodeshift.JSXElement).forEach((path) => {
    jscodeshift(path)
      .find(jscodeshift.ObjectExpression)
      .forEach((objectPath) => {
        const { properties } = objectPath.node;

        if (properties) {
          processLabelProperty(properties, root);
        }
      });
  });

  root.find(jscodeshift.VariableDeclaration).forEach((path) => {
    jscodeshift(path)
      .find(jscodeshift.ObjectExpression)
      .forEach((objectPath) => {
        const { properties } = objectPath.node;

        if (properties) {
          processLabelProperty(properties, root);
        }
      });
  });

  // if the label is not passed directly
  root.find(jscodeshift.JSXElement).forEach((elementPath) => {
    const menuAttr = jscodeshift(elementPath)
      .find(jscodeshift.JSXAttribute, { name: { name: "menu" } })
      .find(jscodeshift.ObjectExpression)
      .paths()[0];

    // handling ObjectExpression inside menu attribute
    if (menuAttr) {
      // if a menu attribute with ObjectExpression is found, process it
      const optionsProp = menuAttr.node.properties.find(
        (prop) => prop.key && prop.key.name === "options"
      );

      if (optionsProp && optionsProp.value.type === "ObjectExpression") {
        const propsUnderObj = optionsProp.value.properties;

        if (propsUnderObj.length > 0) {
          const objectName = propsUnderObj[0].value.name;
          findAndProcessOptionsArray(objectName, root);
        }
      }

      const groupTitleOptionsProp = menuAttr.node.properties.find(
        (prop) => prop.key && prop.key.name === "groupTitleOptions"
      );

      if (
        groupTitleOptionsProp &&
        groupTitleOptionsProp.value.type === "ArrayExpression"
      ) {
        groupTitleOptionsProp.value.elements.forEach((elem) => {
          if (elem && elem.key && elem.key.name === "options") {
            elem.value.elements.forEach((optionObj) => {
              const propsUnderObj = optionObj.value.properties;

              if (propsUnderObj.length > 0) {
                const objectName = propsUnderObj[0].value.name;
                findAndProcessOptionsArray(objectName, root);
              }
            });
          }
        });
      }
    } else {
      //  handling JSX options attribute
      const optionsAttr = jscodeshift(elementPath)
        .find(jscodeshift.JSXAttribute, { name: { name: "options" } })
        .paths()[0];

      const groupTitleOptionsAttr = jscodeshift(elementPath)
        .find(jscodeshift.JSXAttribute, { name: { name: "groupTitleOptions" } })
        .paths()[0];

      if (optionsAttr) {
        const attributeValue = optionsAttr.node.value;

        if (
          attributeValue &&
          attributeValue.type === "JSXExpressionContainer" &&
          attributeValue.expression
        ) {
          const objectName = attributeValue.expression.name;
          findAndProcessOptionsArray(objectName, root);
        }
      }

      if (groupTitleOptionsAttr) {
        const attributeValue = groupTitleOptionsAttr.node.value;

        if (
          attributeValue &&
          attributeValue.type === "JSXExpressionContainer" &&
          attributeValue.expression &&
          attributeValue.expression.type === "ArrayExpression"
        ) {
          attributeValue.expression.elements.forEach((elem) => {
            elem.properties.forEach((objExpr) => {
              if (objExpr && objExpr.key && objExpr.key.name === "options") {
                objExpr.value.elements.forEach((optionObj) => {
                  const propsUnderObj = optionObj.properties;

                  if (propsUnderObj.length > 0) {
                    const objectName = propsUnderObj[0].value.name;
                    findAndProcessOptionsArray(objectName, root);
                  }
                });
              }
            });
          });
        }
      }
    }
  });

  // creating modified source code file using updated AST
  return root.toSource();
};

module.exports = transform;
