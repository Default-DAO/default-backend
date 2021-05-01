const sendWrapped = (result) => ({ result, error: false });

const wrappedError = (errorCode) => ({ errorCode, error: true });

module.export = { sendWrapped, wrappedError };
