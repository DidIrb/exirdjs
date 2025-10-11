import { ExirdConfig } from "../../../../../types"
import { checkAction, configPath, updateConfig, updateENV } from "../../../shared/utils"
import { setupMongoose } from "./mongoose"
import fs from "fs-extra"
import chalk from "chalk"
import { globalErrorHandler } from "../../../../../config/errorHandler"
import { ReinitializeExpress, setupDB } from "../../utils"
import setupEnv from "../../../addons/sub-actions/setup-env"
import { setupExird } from "../../../setup-exird"
import { setupMongoDBNative } from "./mongo"

// Shared function to set environment variables
export const setupMongoDBEnv = () => {
  const environments = ["DEVELOPMENT", "TEST", "STAGING", "PRODUCTION"]
  const newVariables = {
    MONGO_URI: "mongodb+srv://<username>:<password>@cluster0.mongodb.net/database?retryWrites=true&w=majority",
  }
  updateENV(".env", environments, newVariables)
}

// Main function to determine and route the setup process
export const setupMongoDB = {
  name: "setup-mongodb",
  description: "Sets up the database configuration for the project.",
  execute: async (force: boolean = false) => {
    try {
      if (!fs.existsSync(configPath)) await setupExird.execute(force)
      const config: ExirdConfig = fs.readJsonSync(configPath)

      if (!config.addons["env"]) {
        setupEnv.execute()
        updateConfig("addons", { ...config.addons, env: setupEnv.description }, configPath)
      }

      if (checkAction("setup-database", force)) return

      await ReinitializeExpress(force)

      if (!config?.database?.name) {
        console.log(chalk.cyan("MSG"), "Only MongoDB supported!, More Features Pending...")
        config.database = await setupDB()
        await updateConfig("database", config.database, configPath)
      }

      // Route to the appropriate setup based on the mapper
      if (config.database.mapper === "mongoose") {
        await setupMongoose.execute()
      } else {
        await setupMongoDBNative.execute()
      }

      updateConfig("actions", ["setup-database"], configPath)
    } catch (error) {
      globalErrorHandler(error)
    }
  },
}
