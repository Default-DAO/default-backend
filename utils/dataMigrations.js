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

// this function is DB schema agnostic. Will export a JSON object where
// each property is a table name containing an array of rows.
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

// this func is set to import from v1 schema (before migration 20210710055923_voting)
// into v2 schema (after migration 20210723003246_db_redesign) has been applied
const importDbV1 = async (filePath) => {
  const importFileContents = fs.readFileSync(filePath);

  // delete all rows
  const models = getAllModelNames();
  for (const model of models) {
    const modelName = _.camelCase(model);
    await prisma[modelName].deleteMany({});
  }

  // create DAO
  const defaultDao = prisma.dao.create({ data: { name: 'Default', tokenSymbol: 'Ð' } });

  const { protocol } = importFileContents;

  const newProtocolRows = protocol.map((p) => ({
    epoch: p.epochNumber,
    dntWithdrawFee: p.dntWithdrawFee,
    usdcWithdrawFee: p.usdcWithdrawFee,
    mintAmt: p.dntEpochRewardIssuanceAmount,
    budgetAmt: null,
    rewardDistributions: p.dntRewardDistributions,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  // write all rows
  const { apiMember, txMember } = importFileContents;

  const memberMap = apiMember.map((m) => ({
    ethAddress: m.ethAddress,
    type: m.type,
    alias: m.alias,
    liquidityCapUsdc: m.liquidityCapUsdc,
    liquidityCapEpochUsdc: m.liquidityCapEpochUsdc,
    totalLiquidity: m.totalLiquidity,
    totalRewardsEarned: m.totalRewardsEarned,
    netGain: m.netGain,
    netPosition: m.netPosition,
    claimed: m.claimed,
    cap: m.cap,
    nonce: m.nonce,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    daoId: defaultDao.id,
  }));
};

module.exports = {
  exportDb,
  importDbV1,
};
