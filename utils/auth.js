const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');

const isValidSignature = (ethAddress, nonce, chainId, signature) => {
    let signedMsg = authMsg;
    signedMsg.domain.chainId = chainId;
    signedMsg.message.nonce = nonce;

    const recovered = sigUtil.recoverTypedSignature_v4({
        data: signedMsg,
        sig: signature,
    });

    return ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(ethAddress);
}

const authMsg = {
    domain: {
        chainId: null,
        name: 'Default',
        //verifyingContract: '', // set this to Default contract address
        version: 'alpha',
    },
    message: {
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
    authMsg,
    jwtAlgorithm,
    jwtOptions,
    isValidSignature,
};