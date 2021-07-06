/* eslint-disable no-restricted-syntax, no-console, no-await-in-loop */
const { _ } = require('lodash');
const fs = require('fs');
const { prisma } = require('../prisma/index');

const getAllModelNames = () => {
  const models = [];
  // eslint-disable-next-line no-underscore-dangle
  prisma._dmmf.datamodel.models.forEach((modelInfo) => {
    models.push(modelInfo.name);
  });
  return models;
};

const exportDb = async (filePath) => {
  const result = {};
  const models = getAllModelNames();

  // use for loop to avoid having to dealing with another async function
  // aka the callback from forEach.

  for (const model of models) {
    const modelName = _.camelCase(model);
    const rows = await prisma[modelName].findMany();
    result[modelName] = [];
    rows.forEach((row) => {
      result[modelName].push(row);
    });
  }

  console.log('writing to file');
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(result), (err) => {
      if (err) {
        console.error(err);
      }
      console.log('DB successfully exported');
    });
  }

  return result;
};

const importDb = async (filePath) => {
  const importFileContents = fs.readFileSync(filePath);
  // delete all rows
  const models = getAllModelNames();
  for (const model of models) {
    const modelName = _.camelCase(model);
    await prisma[modelName].deleteMany({});
  }

  // write all rows
  console.log(`importFileContents === ${JSON.stringify(importFileContents)}`);
};

module.exports = {
  exportDb,
  importDb,
};
