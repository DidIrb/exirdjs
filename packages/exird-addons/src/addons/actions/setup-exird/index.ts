import chalk from "chalk"
import fs from "fs-extra"
import path from "path"
import { globalErrorHandler } from "../../../config/errorHandler"
import { Action, ExirdConfig } from "../../../types/actions"
import { exirdjsContent } from "../../workflows/content"
import { updateConfig } from "../shared/utils"
import { createWorkflowsFolder, generateConfig, generateWorkflow } from "./config"
import { getFolder, promptInitializeNewProject } from "./prompts"
import { checkDirectory } from "./utils"

export const setupExird: Action = {
  name: "setup-exird",
  description: "Initializing an Exirdjs project with specified configurations",
  async execute(force: boolean = false) {
    const dirPath = process.cwd()

    try {
      const projectDetails = await checkDirectory(dirPath)

      if (projectDetails.isExird && !force) {
        console.log(chalk.yellow("WRN"), "Exird already initialized. Aborting to prevent overwrites.")
        return
      }

      let config: ExirdConfig
      let configPath: string
      let folderMessage: string = ""

      if ((!projectDetails.isEmpty && !projectDetails.hasExpress) || projectDetails.packageJsonExists) {
        console.log("Express Project cannot be initialized at this location")
        const initializeNewProject = await promptInitializeNewProject()
        if (initializeNewProject === "Yes") {
          const folder = await getFolder()
          const newFolder = path.join(dirPath, folder)
          fs.ensureDirSync(newFolder)
          process.chdir(newFolder)
          config = await generateConfig(projectDetails)
          config.name = folder
          folderMessage = `cd ${folder}`
          configPath = path.join(newFolder, ".exird", "exird.config.json")
        } else {
          console.log(chalk.grey("EXT"), "Project initialization aborted.")
          process.exit(0)
        }
      } else {
        config = await generateConfig(projectDetails)
        configPath = path.join(process.cwd(), ".exird", "exird.config.json")
      }

      const exirdDir = path.join(process.cwd(), ".exird")
      fs.ensureDirSync(exirdDir)
      fs.writeFileSync(path.join(exirdDir, "exird.config.json"), JSON.stringify(config, null, 2))

      createWorkflowsFolder(process.cwd())

      generateWorkflow({
        projectPath: process.cwd(),
        workflowName: "exirdjs",
        content: exirdjsContent,
      })

      await updateConfig("actions", ["setup-exird"], configPath)

      console.log(chalk.green("SCS"), `Exird initialized successfully!\n${folderMessage}\nNow run exird workflow`)
    } catch (error) {
      globalErrorHandler(error)
    }
  },
}
