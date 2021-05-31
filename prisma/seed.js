// prisma db seed --preview-feature
// npx prisma migrate reset
// https://gist.github.com/ibraheem4/ce5ccd3e4d7a65589ce84f2a3b7c23a3

const { apiMember, txMember } = require('./seed/member');
const { allocateValue } = require('./seed/value');
const { delegateStake } = require('./seed/stake');
const { protocol } = require('./seed/protocol');
const { transactDnt, transactUsdc } = require('./seed/tokens');
const replay = require('./seed/replay');

async function main() {
  // await protocol();
  // await txMember();
  // await apiMember();
  // await transactDnt();
  // await transactUsdc();
  // await allocateValue();
  // await delegateStake();
  await replay();
}

main().then(() => {
  process.exit();
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
