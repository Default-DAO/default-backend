const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');
const uuid = require('uuid');

const { INVALID_SIGNATURE } = require('../config/keys');

const { prisma } = require('../prisma/index');

const checkSumAddress = (ethAddress) => ethUtil.toChecksumAddress(ethAddress);

const isCheckSumAddress = (ethAddress) => ethUtil.toChecksumAddress(ethAddress) === ethAddress;

const authMsg = {
  domain: {
    chainId: null,
    name: 'Default',
    // verifyingContract: '', // set this to Default contract address
    version: 'alpha',
  },
  message: {
    content: 'Hi there from Ðefault! Sign this message to prove you '
      + 'have access to this wallet and we’ll log you in. '
      + 'This won’t cost you any Ether.', // TODO find easy way to preserve UI message while setting nonce.
    nonce: null,
  },
  primaryType: 'Nonce',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      //  { name: 'verifyingContract', type: 'address' },
    ],
    Nonce: [{ name: 'nonce', type: 'string' }],
  },
};

const isValidSignature = (ethAddress, nonce, chainId, signature) => {
  const signedMsg = authMsg;
  signedMsg.domain.chainId = chainId;
  signedMsg.message.nonce = nonce;

  const recovered = sigUtil.recoverTypedSignature_v4({
    data: signedMsg,
    sig: signature,
  });

  const recoveredCheckSum = ethUtil.toChecksumAddress(recovered);
  const providedCheckSum = ethUtil.toChecksumAddress(ethAddress);

  return recoveredCheckSum === providedCheckSum;
};

// TODO add custom options to allow different messaging
// for example separate GIVE and GET messaging.
const authMiddleware = async (req, res, next) => {
  try {
    const { signature, ethAddress, chainId } = req.body || req.query;

    const member = await prisma.apiMember.findUnique({
      where: { ethAddress },
    });

    if (member && isValidSignature(ethAddress, member.nonce, chainId, signature)) {
      await prisma.apiMember.update({
        where: { id: member.id },
        data: { nonce: uuid.v4() },
      });

      next();
    } else {
      res.sendError(INVALID_SIGNATURE);
      return;
    }
  } catch (err) {
    console.log("Failed authMiddleware: ", err)
    res.status(400).send(err);
  }
};

module.exports = {
  checkSumAddress,
  isCheckSumAddress,
  authMsg,
  isValidSignature,
  authMiddleware,
};
