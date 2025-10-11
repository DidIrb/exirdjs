import fs from "fs-extra"
import path from "path"
import { DirectoryCheckResult, GenerateWorkflowParams } from "../../../types"
import { getDatabase, getDBType, getMapper } from "../setup-database/prompts"
import { getEntryPoint, getLanguage, getModuleSystem, getPackageManager, getProjectName } from "./prompts"

export async function generateConfig(projectDetails: DirectoryCheckResult) {
  const language = projectDetails.hasTypeScript ? "TypeScript" : await getLanguage()
  const entry = projectDetails.entry || (await getEntryPoint(language))
  const type = projectDetails.databaseType || (await getDBType())
  const databaseName = projectDetails.database || (await getDatabase(type))
  const mapper = projectDetails.mapper || (type !== "NoSQL" ? await getMapper(type) : undefined)

  const database = {
    type: type.toLowerCase(),
    name: databaseName.toLowerCase(),
    ...(mapper && { mapper: mapper.toLowerCase() }),
  }

  const config = {
    packageManager: projectDetails.packageManager || (await getPackageManager()),
    name: projectDetails.name || (await getProjectName()),
    language: language,
    entry: entry,
    format: projectDetails.moduleSystem === "module" ? "ES6" : await getModuleSystem(),
    exird: true,
    actions: [],
    addons: {},
    database: database,
  }

  return config
}

export function createWorkflowsFolder(projectPath: string) {
  const workflowsPath = path.join(projectPath, ".exird", "workflows")
  fs.ensureDirSync(workflowsPath)
}

export function generateWorkflow({ projectPath, workflowName, content }: GenerateWorkflowParams) {
  const workflowsPath = path.join(projectPath, ".exird", "workflows")
  fs.ensureDirSync(workflowsPath)
  fs.writeFileSync(path.join(workflowsPath, `${workflowName}.yml`), content)
}
