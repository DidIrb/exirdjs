import Enquirer from "enquirer"
import { ExirdConfig } from "../../../types"

const { prompt } = Enquirer

export async function getDBType(): Promise<string> {
  const response: ExirdConfig = await prompt({
    type: "select",
    name: "database.type",
    message: "Do you want to use SQL or NoSQL?",
    choices: ["SQL", "NoSQL"],
  })
  return response.database.type
}

export async function getDatabase(type: string): Promise<string> {
  const choices = type === "SQL" ? ["MySQL", "PostgreSQL"] : ["MongoDB"]

  const response: ExirdConfig = await prompt({
    type: "select",
    name: "database.name",
    message: "Choose a database:",
    choices,
  })
  return response.database.name
}

export async function getMapper(type: string): Promise<string> {
  const response: { mapper: boolean } = await prompt({
    type: "confirm",
    name: "mapper",
    message: `Do you want to use, ${type === "NoSQL" ? "Object Data Modeling" : "Object-Relational Mapping"}?`,
    initial: true,
  })

  if (response.mapper) {
    const choices = type === "SQL" ? ["Sequelize", "TypeORM", "Prisma"] : ["Mongoose", "Prisma"]
    const res: ExirdConfig = await prompt({
      type: "select",
      name: "database.mapper",
      message: `Choose an ${type === "NoSQL" ? "ODM" : "ORM"}:`,
      choices,
    })
    return res.database.mapper
  } else {
    return ""
  }
}
