import fs from "fs-extra"
import { Listr } from "listr2"
import { globalErrorHandler } from "../../../config/errorHandler"
import { Action, ExirdConfig } from "../../../types"
import { setupExird } from "../setup-exird"
import { checkAction, checkForPackageJson, configPath, createFile, execPromise, installDependencies, updateConfig } from "../shared/utils"
import { entryFile, getGitignore, getReadme, getTsConfig } from "./content"
import { initializeProject, showMsg, updateScripts } from "./utils"

export const setupExpress: Action = {
  name: "setup-express",
  description: "Setting up an Express project with necessary configurations",
  async execute(force: boolean = false): Promise<void> {
    const dirPath: string = process.cwd()
    const config: ExirdConfig = fs.readJsonSync(configPath)
    try {
      if (!fs.existsSync(configPath)) await setupExird.execute(force)
      if (checkAction("setup-express", force)) return

      const tasks = new Listr([
        {
          title: "Initializing project if necessary",
          task: async () => {
            if (!checkForPackageJson(dirPath)) await initializeProject(config.packageManager)
          },
        },
        {
          title: "Creating necessary files",
          task: async () => {
            if (config.language === "TypeScript") {
              await createFile(".gitignore", getGitignore())
              await createFile("tsconfig.json", getTsConfig(config.format))
              await createFile("README.md", getReadme("TypeScript"))
              await createFile(config.entry, entryFile(config.language, config.format))
            } else {
              await createFile(".gitignore", getGitignore())
              await createFile(config.entry, entryFile(config.language, config.format))
              await createFile("README.md", getReadme("JavaScript"))
            }
          },
        },
        {
          title: "Installing dependencies...",
          task: async () => {
            await installDependencies(config.packageManager, {
              deps: ["express"],
              devDeps:
                config.language === "TypeScript" ? ["typescript", "@types/node", "@types/express", "ts-node-dev", "tsup"] : ["nodemon", "tsup"],
            })
          },
        },
        {
          title: "Setting package name",
          task: async () => {
            await execPromise(`pnpm pkg set name=${config.name}`)
            if (config.language === "JavaScript" && config.format === "ES6") {
              await execPromise(`${config.packageManager} pkg set type="module"`)
            }
          },
        },
        {
          title: "Updating package.json scripts",
          task: async () => {
            await updateScripts(config.packageManager, config.entry, config.language)
          },
        },
        {
          title: "Updating configuration values",
          task: async () => {
            await updateConfig("actions", ["setup-express"], configPath)
          },
        },
      ])

      await tasks.run()
      showMsg(config)
      // printMessage(chalk.green("SCS"), "Express base setup complete.")
    } catch (error) {
      globalErrorHandler(error)
    }
  },
}
