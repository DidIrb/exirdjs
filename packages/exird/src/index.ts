import chalk from "chalk"
import { program } from "commander"
import { runWorkflow, runActions, setupExird, updateENV, promptWorkflowSelection } from "exird-addons"
import { readFileSync } from "fs"
import path from "path"
import fs from "fs"

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"))

process.on("SIGINT", () => {
  console.log(chalk.red("\nEXT"), "Operation canceled!")
  process.exit(0)
})

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version, "-v, --version", "output the current version")
  .helpOption("-h, --help", "display help for command")

program
  .command("init")
  .description("Initialize a new express project")
  .action(() => setupExird.execute(false))

program
  .command("env <variables...>")
  .description("Add environment variables")
  .action((variables: string[]) => {
    const obj = variables.reduce((acc: { [key: string]: string }, cur: string) => {
      const [key, value] = cur.split("=")
      acc[key] = value || ""
      return acc
    }, {})

    updateENV(".env", ["DEVELOPMENT", "TEST", "STAGING", "PRODUCTION"], obj)
  })

program
  .command("run <actionName> [subActions...]")
  .description("Run a specified action")
  .option("-f, --force", "force the action to run")
  .allowUnknownOption(true)
  .action(runActions)

program
  .command("workflow [workflowName]")
  .description("Run a specified workflow")
  .action(async (workflowName) => {
    const cwd = process.cwd()
    const workflowsDir = path.join(cwd, ".exird", "workflows")

    if (!fs.existsSync(workflowsDir)) {
      console.error(chalk.gray("EXT"), "No workflows directory found.")
      return
    }

    const files = fs
      .readdirSync(workflowsDir)
      .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
      .map((file) => file.replace(/\.yaml$|\.yml$/, ""))

    if (files.length === 0) {
      console.log("No workflows found in .exird/workflows.")
      return
    }

    if (!workflowName) {
      workflowName = await promptWorkflowSelection(files)
    }

    await runWorkflow(workflowName)
  })

program.parse(process.argv)
