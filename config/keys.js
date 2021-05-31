// error codes
const INVALID_SIGNATURE = 'invalidSignature';
const UNREGISTERED = 'unregistered'
const NOT_WHITELISTED = 'notWhitelisted';
const ALREADY_CLAIMED = 'alreadyClaimed';
const BAD_REQUEST = 'badRequest';
const INTERNAL_ERROR = 'internalError';
const ALREADY_OCCURRED = 'alreadyOccurred';
const OVER_LIMIT = 'overLimit';
const NO_STAKE_FOUND = 'noStakeFound';
const NO_DELEGATION_FOUND = 'noDelegationFound';
const PENDING = 'pending'

const PAGINATION_LIMIT = 200;

module.exports = {
  INVALID_SIGNATURE,
  UNREGISTERED,
  NOT_WHITELISTED,
  ALREADY_CLAIMED,
  BAD_REQUEST,
  INTERNAL_ERROR,
  PAGINATION_LIMIT,
  ALREADY_OCCURRED,
  OVER_LIMIT,
  NO_STAKE_FOUND,
  NO_DELEGATION_FOUND,
  PENDING
};
