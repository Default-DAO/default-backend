const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');

const isCheckSumAddress = (ethAddress) =>
    ethUtil.toChecksumAddress(ethAddress) === ethAddress;

const isValidSignature = (ethAddress, nonce, chainId, signature) => {
    let signedMsg = authMsg;
    signedMsg.domain.chainId = chainId;
    signedMsg.message.nonce = nonce;

    const recovered = sigUtil.recoverTypedSignature_v4({
        data: signedMsg,
        sig: signature,
    });

    const recoveredCheckSum = ethUtil.toChecksumAddress(recovered);
    const providedCheckSum = ethUtil.toChecksumAddress(ethAddress);

    return recoveredCheckSum === providedCheckSum;
}


const authMsg = {
    domain: {
        chainId: null,
        name: 'Default',
        //verifyingContract: '', // set this to Default contract address
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

const jwtAlgorithm = 'HS256';

const jwtOptions = {
    algorithm: jwtAlgorithm,
    expiresIn: 60 * 60 * 24 * 7, // 1 week
};

module.exports = {
    isCheckSumAddress,
    authMsg,
    jwtAlgorithm,
    jwtOptions,
    isValidSignature,
};