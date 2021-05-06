const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const members = {
  fullyallocated: {
    ethAddress: '0x02AAF5B44123a20C5565b6C8f557C41ec85b39D4',
    alias: 'fullyallocated'
  },
  soma: {
    ethAddress: '0x5672b4355c4Fd85c016d22d828f6A3875FdfcD43',
    alias: 'soma'
  },
  zaz: {
    ethAddress: '0x06A4ABf578D8739Bf15D779daf5D445aeE478e5B',
    alias: 'zaz'
  },
  scottsgc: {
    ethAddress: '0xd7d9bce78acead3eb9199097C0db6f03a1f3082a',
    alias: 'scottsgc'
  }
}

const randomEthAddresses = [
  '0xACfCc092898B9BB277D60a13084233609c8011f7',
  '0x46d036e5685d9b30630b1526243ad37F4A5D3a0C',
  '0x065BfdFDa7225059d6f2b9B81352Ad5DD058635E',
  '0x7948380DEBfB312af5d4BbdfFD491ca8D52c6B66',
  '0xb950816466486b0bf8f3652C6Da798DAE0e20Fd6',
  '0xc9Ecd37a4307DcA54E7C25E32C18a7daBC82c8B6',
  '0x6AD79631CC7E3898EFD7Def8e8788e213068d022',
  '0x5B7BD85d31f5dc7d21f21c399847b709F0bBb8f5',
  '0x69c57e403C8FfF7467fa70628C8820bF58C39662',
  '0x5029dfc48B3Cf8e9CACFdf08188829caf757b20e',
  '0x600F7a254d4179Bd754E20B33BfF4b6eF76b4205',
  '0xF87d48fD2d5f80DeF989604C10b49834322fAb1A',
  '0xB29B0784fcc981a1b7CD8b23875fb49e5ACe5E6B',
  '0x32fd38f5E112F63F7B18f12037628781B1BC4a98',
  '0xB3AD70e6d3DC6dC52064dfbfE6Ba794522c92eFb',
  '0x8fB594CFc763862966B0715949b681f0AE3e60F9',
  '0x644B7D1FaBe52F106a298f2EE2f368b6FEceA530',
  '0xF2b24E09027816f265DAB32dCa84dd274c4122df',
  '0xc042cc6FfC6D0f9c459793EeD1f0fb8EE34f6771'
]

async function apiMember() {
  const fullyallocated = await prisma.apiMember.upsert({
    where: { ethAddress: members.fullyallocated.ethAddress },
    update: {},
    create: {
      ethAddress: members.fullyallocated.ethAddress,
      totalLiquidity: 100000,
      totalRewardsEarned: 50000,
      claimed: true,
      cap: 100000,
    }
  })

  const soma = await prisma.apiMember.upsert({
    where: { ethAddress: members.soma.ethAddress },
    update: {},
    create: {
      ethAddress: members.soma.ethAddress,
      totalLiquidity: 100000,
      totalRewardsEarned: 50000,
      claimed: true,
      cap: 100000
    }
  })

  const zaz = await prisma.apiMember.upsert({
    where: { ethAddress: members.zaz.ethAddress },
    update: {},
    create: {
      ethAddress: members.zaz.ethAddress,
      totalLiquidity: 100000,
      totalRewardsEarned: 50000,
      claimed: true,
      cap: 100000,
    }
  })

  const scottsgc = await prisma.apiMember.upsert({
    where: { ethAddress: members.scottsgc.ethAddress },
    update: {},
    create: {
      ethAddress: members.scottsgc.ethAddress,
      totalLiquidity: 100000,
      totalRewardsEarned: 50000,
      claimed: false,
      cap: 100000,
    }
  })

  let randomApiMembers = []
  randomEthAddresses.forEach((address, i) => {
    randomApiMembers.push({
      ethAddress: address,
      totalLiquidity: 100000,
      totalRewardsEarned: 50000,
      claimed: true,
      cap: 100000
    })
  })
  await prisma.apiMember.createMany({
    data: randomApiMembers,
    skipDuplicates: true,
  })
}

async function txMember() {
  const fullyallocated = await prisma.txMember.upsert({
    where: { ethAddress: members.fullyallocated.ethAddress },
    update: {},
    create: {
      ethAddress: members.fullyallocated.ethAddress,
      type: 'PERSONAL',
      alias: members.fullyallocated.alias,
      createdEpoch: 0,
      liquidityCapUsdc: 100000,
      liquidityCapEpoch: 100000,
    }
  })

  const soma = await prisma.txMember.upsert({
    where: { ethAddress: members.soma.ethAddress },
    update: {},
    create: {
      ethAddress: members.soma.ethAddress,
      type: 'PERSONAL',
      alias: members.soma.alias,
      createdEpoch: 0,
      liquidityCapUsdc: 100000,
      liquidityCapEpoch: 100000,
    }
  })

  const zaz = await prisma.txMember.upsert({
    where: { ethAddress: members.zaz.ethAddress },
    update: {},
    create: {
      ethAddress: members.zaz.ethAddress,
      type: 'PERSONAL',
      alias: members.zaz.alias,
      createdEpoch: 0,
      liquidityCapUsdc: 100000,
      liquidityCapEpoch: 100000,
    }
  })

  const scottsgc = await prisma.txMember.upsert({
    where: { ethAddress: members.scottsgc.ethAddress },
    update: {},
    create: {
      ethAddress: members.scottsgc.ethAddress,
      type: 'ENTITY',
      alias: members.scottsgc.alias,
      createdEpoch: 0,
      liquidityCapUsdc: 100000,
      liquidityCapEpoch: 100000,
    }
  })
  let randomApiMembers = []
  randomEthAddresses.forEach((address, i) => {
    randomApiMembers.push({
      ethAddress: address,
      type: 'PERSONAL',
      alias: 'user' + i,
      createdEpoch: (i % 3) + 1,
      liquidityCapUsdc: 100000,
      liquidityCapEpoch: 100000
    })
  })
  await prisma.txMember.createMany({
    data: randomApiMembers,
    skipDuplicates: true,
  })
}

module.exports = {
  members,
  randomEthAddresses,
  apiMember,
  txMember
}
