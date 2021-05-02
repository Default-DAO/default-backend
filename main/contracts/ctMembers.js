const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

const { authMiddleware } = require('../utils/auth');

router.get('/api/ctMember/getMembers', async (req, res) => {
  try {
    const {
      page,
    } = req.body;

    const members = await prisma.txMember.findMany({
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });
    console.log(members);

    res.send({
      result: {
        members,
        error: false,
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
}),

router.get('/api/ctMember/getMember', async (req, res) => {
  try {
    const {
      ethAddress,
      alias,
    } = req.body;

    const member = await prisma.txMember.findUnique({
      where: {
        ethAddress,
        alias,
      },
    });
    console.log(member);

    res.send({
      result: {
        member,
        error: false,
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
}),

router.post('/api/ctMember/registerNewMember', async (req, res) => {
  try {
  //STEP0. CHECK WHITELIST DB FOR ETH ADDRESS

  //STEP1. REGISTER MEMBER

  } catch (err) {
    res.status(400).send(err);
  }
});
