import { Listr } from "listr2"
import path from "path"
import { ExirdConfig } from "../../../../../types"
import { setupMongoDBEnv } from "./"
import { installPackages, updateEntryFile } from "../../utils"
import fs from "fs-extra"
import chalk from "chalk"
import { configPath } from "../../../shared/utils"

const createDBFile = (config: ExirdConfig) => {
  let content = ""
  if (config.language === "TypeScript") {
    content = `
import mongoose from 'mongoose';
import config from './config';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongo_uri, {
      maxPoolSize: 10,
      ssl: true,
    } as mongoose.ConnectOptions);
    await mongoose.connect(config.mongo_uri);
    await mongoose.connection.db?.admin().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', (err as Error).message);
    process.exit(1);
  }
};

export default connectDB;
    `.trim()
  } else if (config.language === "JavaScript" && config.format === "ES6") {
    content = `
import mongoose from 'mongoose';
import config from './config';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo_uri, {
      maxPoolSize: 10,
      ssl: true,
    });
    await mongoose.connect(config.mongo_uri);
    await mongoose.connection.db?.admin().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
    `.trim()
  } else if (config.language === "JavaScript" && config.format === "CommonJS") {
    content = `
const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo_uri, {
      maxPoolSize: 10,
      ssl: true,
    });
    await mongoose.connect(config.mongo_uri);
    await mongoose.connection.db?.admin().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
    `.trim()
  }

  const filePath = path.resolve(process.cwd(), config.language === "TypeScript" ? "src/db.ts" : "src/db.js")
  return fs.promises.writeFile(filePath, content.trim())
}

export const setupMongoose = {
  name: "setupMongoDB",
  description: "Setup MongoDB environment variables and configurations using Mongoose.",
  execute: async () => {
    const config: ExirdConfig = fs.readJsonSync(configPath)
    console.log(chalk.cyan("MSG"), "Setting up MongoDB with Mongoose...")
    const tasks = new Listr([
      {
        title: "Installing packages",
        task: () => installPackages(config.packageManager, ["mongoose"]),
      },
      {
        title: "Creating db file",
        task: () => createDBFile(config),
      },
      {
        title: "Setting environment variables",
        task: setupMongoDBEnv,
      },
      {
        title: "Updating entry file",
        task: () => updateEntryFile(config),
      },
    ])

    await tasks.run()
    console.log("MongoDB setup with Mongoose completed.")
  },
}
