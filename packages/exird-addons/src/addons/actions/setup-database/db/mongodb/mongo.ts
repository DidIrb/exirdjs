import { Listr } from "listr2"
import path from "path"
import { ExirdConfig } from "../../../../../types"
import { setupMongoDBEnv } from "./index"
import { installPackages, updateEntryFile } from "../../utils"
import fs from "fs-extra"
import chalk from "chalk"
import { configPath } from "../../../shared/utils"

const createDBFile = (config: ExirdConfig) => {
  let content = ""
  if (config.language === "TypeScript") {
    content = `
import { MongoClient } from 'mongodb';
import config from './config';

const connectDB = async (): Promise<void> => {
  const client = new MongoClient(config.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

export default connectDB;
    `.trim()
  } else if (config.language === "JavaScript" && config.format === "ES6") {
    content = `
import { MongoClient } from 'mongodb';
import config from './config';

const connectDB = async () => {
  const client = new MongoClient(config.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

export default connectDB;
    `.trim()
  } else if (config.language === "JavaScript" && config.format === "CommonJS") {
    content = `
const { MongoClient } = require('mongodb');
const config = require('./config');

const connectDB = async () => {
  const client = new MongoClient(config.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('Pinged, successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

module.exports = connectDB;
    `.trim()
  }

  const filePath = path.resolve(process.cwd(), config.language === "TypeScript" ? "src/db.ts" : "src/db.js")
  return fs.promises.writeFile(filePath, content.trim())
}

export const setupMongoDBNative = {
  name: "setupMongoDBNative",
  description: "Setup MongoDB environment variables and configurations using MongoDB native driver.",
  execute: async () => {
    const config: ExirdConfig = fs.readJsonSync(configPath)
    console.log(chalk.cyan("MSG"), "Setting up MongoDB with native driver...")
    const tasks = new Listr([
      {
        title: "Installing packages",
        task: () => installPackages(config.packageManager, ["mongodb"]),
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
    console.log("MongoDB setup with native driver completed.")
  },
}
