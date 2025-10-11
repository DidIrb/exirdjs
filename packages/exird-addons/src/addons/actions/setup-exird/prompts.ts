import Enquirer from "enquirer"

const { prompt } = Enquirer

export interface ExirdPromptResponse {
  language: string
  moduleSystem: string
  entryPoint: string
  packageManager: string
  projectName: string
  newFolderName?: string
  initializeNewProject?: boolean
  database: Record<string, string>
}

export async function getLanguage(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "select",
    name: "language",
    message: "Choose the language:",
    choices: ["JavaScript", "TypeScript"],
  })
  return response.language
}

export async function getModuleSystem(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "select",
    name: "moduleSystem",
    message: "Choose the module system:",
    choices: ["CommonJS", "ES6"],
  })
  return response.moduleSystem
}

export async function getEntryPoint(language: string): Promise<string> {
  const initialEntryPoint = language === "TypeScript" ? "src/index.ts" : "src/index.js"
  const response: ExirdPromptResponse = await prompt({
    type: "input",
    name: "entryPoint",
    message: "Enter the entry point file name:",
    initial: initialEntryPoint,
  })
  return response.entryPoint
}

export async function getPackageManager(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "select",
    name: "packageManager",
    message: "Choose a package manager:",
    choices: ["npm", "yarn", "pnpm", "bun"],
  })
  return response.packageManager
}

export async function getProjectName(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "input",
    name: "projectName",
    message: "Enter the project name:",
    initial: "exirdjs-project",
  })
  return response.projectName
}

export async function getFolder(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "input",
    name: "newFolderName",
    message: "Enter the name of the new folder:",
    validate: (input: string) => {
      if (input.trim() === ".") {
        return 'Current directory (".") is not allowed. Please enter a valid folder name.'
      }
      if (input.trim().length < 3) {
        return "Folder name must be at least 3 characters long."
      }
      return true
    },
  })
  return response.newFolderName!
}

export async function promptInitializeNewProject(): Promise<string> {
  const response: ExirdPromptResponse = await prompt({
    type: "confirm",
    name: "initializeNewProject",
    message: "Do you want to initialize a new Exird project?",
  })

  return response.initializeNewProject ? "Yes" : "No"
}
