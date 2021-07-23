const { prisma } = require('./index');

const clearDb = async () => {
  for (const { tablename } of await prisma.$queryRaw('SELECT tablename FROM pg_tables WHERE schemaname=\'public\'')) {
    await prisma.$queryRaw(`TRUNCATE TABLE \"public\".\"${tablename}\" CASCADE;`);
  }
  for (const { relname } of await prisma.$queryRaw('SELECT c.relname FROM pg_class AS c JOIN pg_namespace AS n ON c.relnamespace = n.oid WHERE c.relkind=\'S\' AND n.nspname=\'public\';')) {
    await prisma.$queryRaw(`ALTER SEQUENCE \"public\".\"${relname}\" RESTART WITH 1;`);
  }
};

module.exports = {
  clearDb,
};
