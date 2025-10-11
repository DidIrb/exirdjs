// THIS IS A TEMPLATE FOR RUNNING A BASIC WORKFLOW
export const exirdjsContent = `
name: ExirdJS Workflow

steps:
  - name: Setup Exird
    action: setup-exird

  - name: Setup Express
    action: setup-express 

  - name: Setting up eslint and prettier
    action: addons 
    args: --eslint --env
`
