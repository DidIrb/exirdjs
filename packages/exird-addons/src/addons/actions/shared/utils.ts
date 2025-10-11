import chalk from "chalk"
import { exec } from "child_process"
import fs from "fs-extra"
import path from "path"
import { promisify } from "util"
import { ExirdConfig } from "../../../types"

export const configPath = path.join(process.cwd(), ".exird", "exird.config.json")
export const execPromise = promisify(exec)

export const checkForPackageJson = (dirPath: string): boolean => {
  const packageJsonPath = path.join(dirPath, "package.json")
  return fs.existsSync(packageJsonPath)
}

export function updateConfig<K extends keyof ExirdConfig>(key: K, value: ExirdConfig[K], configPath: string) {
  const config: ExirdConfig = fs.readJsonSync(configPath)

  if (Array.isArray(config[key]) && Array.isArray(value)) {
    const uniqueValues = new Set([...(config[key] as string[]), ...value])
    config[key] = Array.from(uniqueValues) as ExirdConfig[K]
  } else if (typeof config[key] === "object" && config[key] !== null && typeof value === "object" && value !== null) {
    config[key] = { ...config[key], ...value }
  } else {
    config[key] = value
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export const executeCommand = async (command: string): Promise<void> => {
  try {
    await execPromise(command)
  } catch (error) {
    console.error(chalk.red("ERR"), `Failed to execute command: ${command}`, error)
    throw error
  }
}

export const checkAction = (action: string, force: boolean = false): boolean => {
  const config: ExirdConfig = fs.readJsonSync(configPath)
  if (!force && config.actions.includes(action)) {
    console.log(chalk.grey("EXT"), `Skipping action:`, chalk.cyan(`${action}`), `has already been executed.`)
    return true
  }
  return false
}

export const installDependencies = async (packageManager: string, dependencies: { deps: string[]; devDeps: string[] }): Promise<void> => {
  try {
    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    const packageJson = fs.existsSync(packageJsonPath) ? await fs.readJson(packageJsonPath) : { dependencies: {}, devDependencies: {} }

    // Ensure dependencies and devDependencies are treated as empty objects if missing
    packageJson.dependencies = packageJson.dependencies || {}
    packageJson.devDependencies = packageJson.devDependencies || {}

    const install = async (deps: string[], dev: boolean) => {
      const missingDeps = deps.filter((dep) => {
        const depName = dep.split("@")[0]
        return !(dev ? packageJson.devDependencies[depName] : packageJson.dependencies[depName])
      })

      if (missingDeps.length > 0) {
        const saveFlag = dev ? "--save-dev" : ""
        await execPromise(`${packageManager} install ${missingDeps.join(" ")} ${saveFlag}`)
      }
    }

    await install(dependencies.deps, false)
    await install(dependencies.devDeps, true)
  } catch (error) {
    console.error(chalk.red("ERR"), `Failed to install dependencies:`, error)
    throw error
  }
}

// TO DELETE LATER
export function printMessage(...messages: string[]) {
  const terminalWidth = process.stdout.columns
  const separator = "-".repeat(terminalWidth)
  console.log(separator)
  console.log(messages.map((msg) => msg.toString()).join(" "))
  console.log(separator)
}

export const normalizeName = (name: string): string => {
  return name
    .replace(/^--/, "")
    .replace(/^-/, "")
    .replace(/^setup-/, "")
}

export const createFile = async (filePath: string, content: string): Promise<void> => {
  try {
    await fs.outputFile(filePath, content)
  } catch (error) {
    console.error(chalk.red("ERR"), `Failed to create file ${filePath}:`, error)
    throw error
  }
}

export const updateENV = (filePath: string, environments: string[], newVariables: { [key: string]: string }) => {
  const config: ExirdConfig = fs.readJsonSync(configPath)
  const envFilePath = path.resolve(process.cwd(), filePath)
  const envFileContent = fs.readFileSync(envFilePath, "utf-8").split("\n")
  let updatedEnvContent = ""
  const sections: { [key: string]: boolean } = {}

  const upperCaseVariables = Object.keys(newVariables).reduce((acc: { [key: string]: string }, key: string) => {
    acc[key.toUpperCase()] = newVariables[key]
    return acc
  }, {})

  envFileContent.forEach((line) => {
    updatedEnvContent += `${line}\n`

    environments.forEach((env) => {
      if (line.includes(`# ${env} variables`)) {
        sections[env] = true
        Object.keys(upperCaseVariables).forEach((variable) => {
          const variablePattern = new RegExp(`^${variable}_${env}=`)
          if (!envFileContent.some((envLine) => variablePattern.test(envLine))) {
            updatedEnvContent += `${variable}_${env}=${upperCaseVariables[variable]}\n`
          }
        })
      }
    })
  })

  environments.forEach((env) => {
    if (!sections[env]) {
      updatedEnvContent += `# ${env} variables\n`
      Object.keys(upperCaseVariables).forEach((variable) => {
        const variablePattern = new RegExp(`^${variable}_${env}=`)
        if (!envFileContent.some((envLine) => variablePattern.test(envLine))) {
          updatedEnvContent += `${variable}_${env}=${upperCaseVariables[variable]}\n`
        }
      })
      updatedEnvContent += "\n"
    }
  })
  let newPath = ""
  if (config.language === "TypeScript") {
    newPath = "src/config.ts"
  } else {
    newPath = "src/config.js"
  }
  fs.writeFileSync(envFilePath, updatedEnvContent)
  updateConfigFile(newPath, newVariables)
  console.log(chalk.green("SCS"), `Environment variables Updated.`)
}

export const updateConfigFile = (configFilePath: string, newVariables: { [key: string]: string }) => {
  const configPath = path.resolve(process.cwd(), configFilePath)
  let configContent = fs.readFileSync(configPath, "utf-8")

  const newConfigEntries = Object.keys(newVariables)
    .map((variable) => {
      const variablePattern = new RegExp(
        `\\s*${variable.toLowerCase()}:\\s*process\\.env\\[\\\`${variable.toUpperCase()}_\\$\\{NODE_ENV\\.toUpperCase\\(\\)\\}\\\`]`,
      )
      if (!variablePattern.test(configContent)) {
        // return `  ${variable.toLowerCase()}: process.env[\`${variable.toUpperCase()}_\${NODE_ENV.toUpperCase()}\`] || '${newVariables[variable]}'`;
        return `  ${variable.toLowerCase()}: process.env[\`${variable.toUpperCase()}_\${NODE_ENV.toUpperCase()}\`]`
      }
      return ""
    })
    .filter((entry) => entry)
    .join(",\n")

  if (newConfigEntries === "") {
    console.log(chalk.gray("EXT"), "No new variables to add.")
    return
  }

  const ensureComma = (match: string, p1: string) => {
    if (p1.trim().endsWith(",")) {
      return `${p1.trim()}\n${newConfigEntries}\n`
    } else {
      return `${p1.trim()},\n${newConfigEntries}\n`
    }
  }

  if (configContent.includes("module.exports = {")) {
    configContent = configContent.replace(/module\.exports = \{([\s\S]*?)\};/, (match, p1) => {
      const updatedObjectContent = ensureComma(match, p1)
      return `module.exports = {\n  ${updatedObjectContent}};`
    })
  } else if (configContent.includes("export default {")) {
    configContent = configContent.replace(/export default \{([\s\S]*?)\};/, (match, p1) => {
      const updatedObjectContent = ensureComma(match, p1)
      return `export default {\n  ${updatedObjectContent}};`
    })
  } else {
    console.error("No config object found in the file.")
    return
  }

  fs.writeFileSync(configPath, configContent)
  console.log(chalk.green("SCS"), `Configurations Updated.`)
}
