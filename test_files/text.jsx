import React from 'react';

const FruitsCheck = () => {
  const fruits = ['Apple', 'Banana', 'Orange', 'Mango'];
  
  // Use some() to check if any fruit is an 'Apple'
  const hasApple = fruits.some(fruit => fruit === 'Apple');

  // Use includes() to check if the array includes 'Mango'
  const hasMango = fruits.includes('Mango');

  // Use some() to check if any fruit has more than 5 letters
  const hasLongName = fruits.some(fruit => fruit.length > 5);

  return (
    <div>
      <h1>Fruit Checks</h1>
      <ul>
        <li>Contains Apple: {hasApple ? 'Yes' : 'No'}</li>
        <li>Contains Mango: {hasMango ? 'Yes' : 'No'}</li>
        <li>Any fruit longer than 5 letters: {hasLongName ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  );
};

export default FruitsCheck;


    // root.find(jscodeshift.VariableDeclaration).forEach((path)=> {
    //     path.node.declarations.forEach((dec)=> {
    //         console.log(isVariableString(dec.init.value, path.scope), 'hey there')

    //     })
    // })
        // return if variable is used in jsx 
      //   const isVariableUsedInJSX = (j, root, variableName) => {
      //     return root
      //       .find(j.JSXExpressionContainer)
      //       .some(path => {
      //         return j(path).find(j.Identifier).some(id => id.node.name === variableName);
      //       });
      //   };
  
      // root
      // .find(jscodeshift.CallExpression)
      

           // replace the variable array which we are using in jsx


          //  root
          //  .find(jscodeshift.VariableDeclarator)
          //  .filter(isVariableInitializedWithArray(jscodeshift))
          //  .forEach(path => {
          //    const variableName = path.node.id.name;
          //    const init = path.node.init;
       
          //    if (init.type === 'ArrayExpression' &&
          //      isVariableVisibleInUI(jscodeshift, root, variableName)) {
          //      const elements = init.elements;
       
          //      if (elements.length > 0) {
          //        const transformedElements = elements
          //          .filter(element => element.type === 'Literal' || element.type === 'StringLiteral')
          //          .map(element => {
          //            const trimmedValue = element.value.trim();
          //            return trimmedValue ? createUseTransitionCall(trimmedValue) : null;
          //          })
          //          .filter(Boolean);
       
          //        if (transformedElements.length > 0) {
          //          path.node.init = jscodeshift.arrayExpression(transformedElements);
          //          checkAndAddTransitionImport(root);
          //        }
          //      }
          //    }
          //  });
     
     
     
