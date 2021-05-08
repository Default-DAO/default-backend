const { Prisma } = require('@prisma/client');
const { prisma } = require('./index');
const { _ } = require('lodash');

const clearDb = () => {
  const modelNames = Prisma.dmmf.datamodel.models.map(
    (model) => _.camelCase(model.name)
  );
  return Promise.all(
    modelNames.map((modelName) => prisma[modelName].deleteMany())
  );

};

module.exports = {
  clearDb
};