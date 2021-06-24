const router = require('express').Router();
const { PAGINATION_LIMIT } = require('../../config/keys');

const { prisma } = require('../../prisma/index');

router.get('/api/ctMember/getMembers', async (req, res) => {
  try {
    let {
      skip,
      excludeEthAddress,
      searchText,
    } = req.query;
    skip = Number(skip);
    searchText = searchText || '';

    // get all claimed members that are not excludeEthAddress.
    // if excludeEthAddress is null this will just return all
    // claimed members
    const members = await prisma.txMember.findMany({
      where: {
        alias: {
          contains: searchText,
          mode: 'insensitive',
        },
        type: 'PERSONAL',
        ethAddress: { not: excludeEthAddress },
        apiMember: { claimed: true },
      },
      skip,
      take: PAGINATION_LIMIT,
    });

    res.send({
      result: {
        members,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed /api/ctMember/getMembers: ', err);
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

module.exports = { router };
