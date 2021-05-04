
// prisma seed ./seed.js
// prisma seed --reset --env-file .env ./seed.js
// https://gist.github.com/ibraheem4/ce5ccd3e4d7a65589ce84f2a3b7c23a3

const { PrismaClient } = require('@prisma/client')
const shortid = require('shortid')
const prisma = new PrismaClient()

const {apiMember, txMember} = require('./seed/member')
const {dntStake} = require('./seed/stake')
const {allocateValue} = require('./seed/value')
const {protocol} = require('./seed/protocol')

async function main() {
  await apiMember()
  await txMember()
  await dntStake()
  await allocateValue()
  await protocol()
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })