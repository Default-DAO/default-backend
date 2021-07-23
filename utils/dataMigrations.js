/* eslint-disable no-restricted-syntax, no-console, no-await-in-loop */
const { _ } = require('lodash');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { clearDb } = require('../prisma/utils');

const options = { log: ['warn', 'error'] };
const prisma = new PrismaClient(options);

const getAllModelNames = () => {
  const models = [];
  // eslint-disable-next-line no-underscore-dangle
  prisma._dmmf.datamodel.models.forEach((modelInfo) => {
    const table = { name: _.camelCase(modelInfo.name), relations: {} };
    modelInfo.fields.forEach((field) => {
      if (field.kind === 'object') {
        table.relations[field.name] = true;
      }
    });
    models.push(table);
  });

  console.log(`models === ${JSON.stringify(models)}`);
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
    const modelName = _.camelCase(model.name);
    const query = _.isEmpty(model.relations) ? {} : { include: { ...model.relations } };
    const rows = await prisma[modelName].findMany(query);

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
const importV1DbToV2 = async (filePath) => {
  const importFileContents = JSON.parse(fs.readFileSync(filePath));

  // delete all rows
  // const models = getAllModelNames();
  // for (const model of models) {
  //   try {
  //     await prisma[model.name].deleteMany({});
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  await clearDb();
  console.log('dropped all models');

  // create DAO, protocols and members
  const defaultDao = await prisma.dao.create({ data: { name: 'Default', tokenSymbol: 'Ð' } });
  console.log(`defaultDao === ${JSON.stringify(defaultDao)}`);

  const { txProtocol } = importFileContents;

  const newProtocolRows = txProtocol.map((p) => ({
    epoch: p.epochNumber,
    dntWithdrawFee: p.dntWithdrawFee,
    usdcWithdrawFee: p.usdcWithdrawFee,
    mintAmt: p.dntEpochRewardIssuanceAmount,
    budgetAmt: null,
    rewardDistributions: p.dntRewardDistributions,
    daoId: defaultDao.id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  await prisma.protocol.createMany({ data: newProtocolRows });
  const protocolFromDb = await prisma.protocol.findMany();

  const protocolMap = protocolFromDb.reduce((acc, p) => {
    acc[p.epoch] = p;
    return acc;
  }, {});

  const { apiMember } = importFileContents;

  // merge the apiMember and txMember tables
  const newMemberRows = apiMember.map((m) => {
    try {
      return {
        ethAddress: m.ethAddress,
        type: m.txMember.type,
        alias: m.txMember.alias,
        liquidityCapUsdc: m.txMember.liquidityCapUsdc,
        liquidityCapEpochUsdc: m.txMember.liquidityCapEpochUsdc,
        totalLiquidity: m.totalLiquidity,
        totalRewardsEarned: m.totalRewardsEarned,
        netGain: m.netGain,
        netPosition: m.netPosition,
        claimed: m.claimed,
        cap: m.cap,
        nonce: m.nonce,
        createdAt: m.txMember.createdAt,
        updatedAt: m.txMember.updatedAt,
        daoId: defaultDao.id,
        protocolId: protocolMap[m.txMember.createdEpoch].id,
      };
    } catch (err) {
      console.log(`m === ${JSON.stringify(m)}`);
      throw new Error(`m === ${JSON.stringify(m)}`);
    }
  });
  await prisma.member.createMany({ data: newMemberRows });
  const membersFromDb = await prisma.member.findMany();
  const memberMap = membersFromDb.reduce((acc, member) => {
    acc[member.ethAddress] = member;
    return acc;
  }, {});

  // at this point we have the DAO, protocols, as well as all of the member info
  // written to the new schema. now write all DNT and USDC tokens

  const { txUsdcToken } = importFileContents;
  const usdcTokensToWrite = txUsdcToken.map((t) => ({
    transactionType: t.transactionType,
    amount: t.amount,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    protocolId: protocolMap[t.createdEpoch].id,
    memberId: memberMap[t.ethAddress].id,
  }));
  await prisma.usdcToken.createMany({ data: usdcTokensToWrite });

  const { txDntToken } = importFileContents;
  const dntTokensToWrite = txDntToken.map((t) => ({
    transactionType: t.transactionType,
    amount: t.amount,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    protocolId: protocolMap[t.createdEpoch].id,
    memberId: memberMap[t.ethAddress].id,
  }));

  await prisma.dntToken.createMany({ data: dntTokensToWrite });

  // now write write the delegations and allocations
  const { txStakeDelegation } = importFileContents;
  const delegationsToWrite = txStakeDelegation.map((d) => ({
    weight: d.weight,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    daoId: defaultDao.id,
    protocolId: protocolMap[d.epoch].id,
    fromMemberId: memberMap[d.fromTxMember.ethAddress].id,
    toMemberId: memberMap[d.toTxMember.ethAddress].id,
  }));
  await prisma.delegation.createMany({ data: delegationsToWrite });

  const { txValueAllocation } = importFileContents;
  const allocationsToWrite = txValueAllocation.map((a) => ({
    weight: a.weight,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    daoId: defaultDao.id,
    protocolId: protocolMap[a.epoch].id,
    fromMemberId: memberMap[a.fromTxMember.ethAddress].id,
    toMemberId: memberMap[a.toTxMember.ethAddress].id,
  }));
  await prisma.allocation.createMany({ data: allocationsToWrite });

  // finally write the proposals and votes
  const { proposal } = importFileContents;
  const proposalPrevIdMap = {};
  const proposalsToWrite = proposal.map((p) => {
    proposalPrevIdMap[p.id] = p;
    return {
      category: p.category,
      name: p.name,
      desc: p.desc,
      duration: p.duration,
      isApproved: p.isApproved,
      isActive: p.isActive,
      result: p.result,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      daoId: defaultDao.id,
      proposerId: memberMap[p.proposerAddress].id,
      protocolId: protocolMap[p.epoch].id,
    };
  });
  await prisma.proposal.createMany({ data: proposalsToWrite });

  const { proposalVote } = importFileContents;
  const proposalVotesToWrite = proposalVote.map((v) => ({
    inFavorOf: v.inFavorOf,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    proposalId: proposalPrevIdMap[v.proposalId].id,
    voterId: memberMap[v.voterAddress].id,
  }));
  await prisma.proposalVote.createMany({ data: proposalVotesToWrite });
  console.log('finished importing db');
};

module.exports = {
  exportDb,
  importV1DbToV2,
};
