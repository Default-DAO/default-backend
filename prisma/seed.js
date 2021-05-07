
// prisma db seed --preview-feature
// https://gist.github.com/ibraheem4/ce5ccd3e4d7a65589ce84f2a3b7c23a3

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const { apiMember, txMember } = require('./seed/member')
const { allocateValue } = require('./seed/value')
const { protocol } = require('./seed/protocol')

async function main() {
  await txMember()
  await apiMember()
  await allocateValue()
  await protocol()
}

main().then(() => {
  process.exit()
}).catch(e => {
  console.error(e)
  process.exit(1)
})