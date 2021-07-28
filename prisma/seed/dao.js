const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDaos() {
  await prisma.member.upsert({
    where: { key: '' },
    create: {
      key: '',
      name: 'Default',
      tokenSymbol: "Ð",
      tokenName: "DNT",

    },
  });

  await prisma.member.upsert({
    where: { key: '' },
    create: {
      key: 'olympus',
      name: 'Olympus',
      tokenSymbol: "O",
      tokenName: "OHM",
    },
  });
}

module.exports = {
  createDaos,
};
