import chalk from "chalk"
import fs from "fs-extra"
import { globalErrorHandler } from "../../../config/errorHandler"
import { Action, ExirdConfig } from "../../../types"
import { setupExird } from "../setup-exird"
import { configPath, normalizeName, updateConfig } from "../shared/utils"
import registerSubActions from "./registry"

const subActions = registerSubActions()

export const addons: Action = {
  name: "addons",
  description: "Setting up additional configurations and dependencies",
  async execute(force: boolean = false, subActionsList: string[] = []): Promise<void> {
    const config: ExirdConfig = fs.readJsonSync(configPath)
    try {
      if (!fs.existsSync(configPath)) await setupExird.execute(force)

      if (subActionsList.length === 0) {
        console.log(chalk.blue("Available sub-actions:"))
        Object.values(subActions).forEach(({ name, description }) => {
          console.log(`- ${name}: ${description}`)
        })
      } else {
        for (const subActionName of subActionsList) {
          const normalized = normalizeName(subActionName)
          if (config.addons[normalized] && !force) {
            console.log(chalk.gray("EXT"), `Addons: "${normalized}" has already been executed.`)
            continue
          }
          const subAction = subActions[normalized]
          if (subAction) {
            await subAction.execute()

            updateConfig("addons", { ...config.addons, [normalized]: subAction.description }, configPath)
          } else {
            throw new Error(`Addons "${subActionName}" not found.`)
          }
        }
      }
    } catch (error) {
      globalErrorHandler(error)
    }
  },
}
