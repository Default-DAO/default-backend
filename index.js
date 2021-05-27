require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { rateLimiter } = require('./utils/rateLimiter');

const main = require('./main/index');
const authentication = require('./main/auth');
const apiMember = require('./main/member');
const ctMember = require('./main/contracts/ctMembers');
const value = require('./main/contracts/ctValue');
const protocol = require('./main/contracts/ctProtocol');
const pools = require('./main/contracts/ctPools');
const stake = require('./main/contracts/ctStake');
const network = require('./main/contracts/ctNetwork');

const { sendWrapped, wrappedError } = require('./utils/wrappedResponse');

express.response.sendWrapped = sendWrapped;
express.response.sendError = wrappedError;

const port = process.env.PORT;
const app = express();

const corsOptions = {
  origin: process.env.FE_URL,
};

app.use(cors(corsOptions));
app.options('*', cors());
app.use(bodyParser.json());
app.use(rateLimiter);

app.use(main.router);
app.use(authentication.router);
app.use(apiMember.router);
app.use(ctMember.router);
app.use(value.router);
app.use(protocol.router);
app.use(pools.router);
app.use(stake.router);
app.use(network.router);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started default-backend on port: ${port}`);
});

// WHEN dUSDC CONTRACT IS LIVE
// pools.subscribeWeb3TransferEvent()

module.exports = {
  app,
};
