// pg_ctl -D /usr/local/var/postgres start
// npx prisma generate
// npx prisma migrate dev

const { PrismaClient } = require('@prisma/client');

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limit.

let prisma;

const options = { log: ['warn', 'error'] };

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(options);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(options);
  }
  prisma = global.prisma;
}

module.exports = {
  prisma,
};
