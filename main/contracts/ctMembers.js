const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');

router.get('/api/ctMember/getMembers', async (req, res) => {
  try {
    const {
      page,
    } = req.query;

    const members = await prisma.txMember.findMany({
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });

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
    } = req.query;

    const member = await prisma.txMember.findUnique({
      where: {
        ethAddress,
        alias,
      },
    });

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

module.exports = {router};
