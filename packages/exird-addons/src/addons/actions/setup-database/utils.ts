import chalk from "chalk"
import { checkDirectory } from "../setup-exird/utils"
import { getDatabase, getDBType, getMapper } from "./prompts"
import { configPath, execPromise, updateConfig, updateENV } from "../shared/utils"
import { setupExpress } from "../setup-express"
import { ExirdConfig } from "../../../types"
import path from "path"
import fs from "fs-extra"
import { setupMongoDB } from "./db/mongodb/"

export const successMessage = () => {
  const message = `

Database setup is complete!
You can now configure your database settings as needed.
`.trim()
  console.log(message)
}

export const setupDB = async (): Promise<Record<string, string>> => {
  const type = await getDBType()
  const mapper = await getMapper(type)
  const database = await getDatabase(type)

  return {
    name: database.toLowerCase(),
    type: type.toLowerCase(),
    mapper: mapper.toLocaleLowerCase(),
  }
}

export const ReinitializeExpress = async (force: boolean) => {
  const path = process.cwd()
  const res = await checkDirectory(path)
  if (!res.hasExpress) {
    console.log(chalk.yellow("WRN"), "Express Required!, Initializing...")
    await setupExpress.execute(force)
  } else {
    await updateConfig("actions", ["setup-express"], configPath)
  }
}

// Shared function to install packages
export const installPackages = (packageManager: string, packages: string[]) => {
  return execPromise(`${packageManager} install ${packages.join(" ")}`)
}

export const setupEnvironmentVariables = () => {
  const environments = ["DEVELOPMENT", "TEST", "STAGING", "PRODUCTION"]
  const newVariables = {
    URI: "https://uri.com",
    PASSWORD: "password",
  }
  updateENV(".env", environments, newVariables)
}

export const NavigateDB = async (config: ExirdConfig) => {
  const dbName = config.database?.name.toLowerCase()
  switch (dbName) {
    case "mongodb":
      await setupMongoDB.execute()
      break
    case "mysql":
      // await setupMySQL.execute();
      break
    case "postgresql":
      // await setupPostgreSQL.execute();
      break
    default:
      console.log(`Database setup for ${config.database.name} is not supported.`)
  }
}
export const updateEntryFile = async (config: ExirdConfig) => {
  const entryFilePath = path.resolve(process.cwd(), config.entry)
  let relativeDbPath = path.relative(path.dirname(entryFilePath), path.resolve(process.cwd(), "src/db"))

  // Ensure the path starts with './' if it's a relative path not starting with '..'
  if (!relativeDbPath.startsWith(".") && !relativeDbPath.startsWith("/")) {
    relativeDbPath = "./" + relativeDbPath
  }

  let entryFileContent = await fs.readFile(entryFilePath, "utf-8")

  const importStatement =
    config.language === "TypeScript"
      ? `import connectDB from '${relativeDbPath.replace(/\\/g, "/")}';\n`
      : config.format === "ES6"
        ? `import connectDB from '${relativeDbPath.replace(/\\/g, "/")}.js';\n`
        : `const connectDB = require('${relativeDbPath.replace(/\\/g, "/")}');\n`

  if (!entryFileContent.includes(importStatement)) {
    const lines = entryFileContent.split("\n")
    const lastImportIndex = lines.reduce(
      (last, line, index) => (line.startsWith("import") || line.startsWith("const") || line.startsWith("require") ? index : last),
      -1,
    )
    lines.splice(lastImportIndex + 1, 0, importStatement)
    entryFileContent = lines.join("\n")
  }

  if (!entryFileContent.includes("connectDB();")) {
    const lines = entryFileContent.split("\n")
    const appListenIndex = lines.findIndex((line) => line.includes("app.listen"))
    if (appListenIndex !== -1) {
      lines.splice(appListenIndex, 0, "connectDB();")
    } else {
      lines.push("connectDB();")
    }
    entryFileContent = lines.join("\n")
  }

  await fs.writeFile(entryFilePath, entryFileContent)
}
