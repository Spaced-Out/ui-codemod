# Codemod for sense(UI), chatbot and chatbot-snippet

This repository is a codemod for running large scale migrations in the UI codebase. 

## Inner Working

If one can list down the steps they would peform manually to do a migration in a single file, and then to the whole codebase, then they have a rough mental algorithm ready. If that is the case, we can automate it.

We follow these simple steps to complete the migration: 

1. **Parse the source code to form an AST**
    The choice of parser impacts a few things: 
    1. Whether code comments are preserved.
    2. Whether code formatting is preserved.
    3. What additional constructs should the parser be aware of, eg. flow, typescript etc.

2. **Traverse the source code to find nodes of interest**
    Whenever you have to perform a migration, you know what you need to change.
    Now, you specify the same intent programmatically.
    Whether you want to modify function declaration, variable declarations, expressions etc.

3. **Modify the nodes**
    Next you update the nodes you want. It's not the same as doing a find and replace. Or using a regex either. The reason being none of these methods give you the context of where you are in the code.

    With an AST, you have essentially a tree representation of code you want to migrate. So, you can specify constraints for walking the tree, or picking a node for modification. Once that is done, you modify the aspect of node you want to change. Or maybe create a new node if you need.

4. **Form the migrated sourced code from the modified AST**
    Next up, you just go in the reverse direction. Source code to AST is a 2 way process. Now, that we have modified the nodes, we can form the source code now, essentially completing our migration.
g

## Debugging
For debugging in VSCode, move the ***.launch.json*** file in the hidden ***.vscode*** folder. If it doesn't exist already, create it. Or else use the VSCode debug UI to create a launch json. This would create the ***.vscode*** folder and a ***.launch.json*** file inside it, replace it's content with the ***.launch.json*** file at the root of the project.