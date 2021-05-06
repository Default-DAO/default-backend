require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authentication = require('./main/auth');
const profile = require('./main/profile');
const members = require('./main/contracts/ctMembers');
const value = require('./main/contracts/ctValue');
const protocol = require('./main/contracts/ctProtocol');
const pools = require('./main/contracts/ctPools');
const stake = require('./main/contracts/ctStake');

const { sendWrapped, wrappedError } = require('./utils/wrappedResponse');

express.response.sendWrapped = sendWrapped;
express.response.sendError = wrappedError;

const port = process.env.PORT;
const app = express();

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.use(authentication);
app.use(profile);
app.use(members);
app.use(value);
app.use(protocol);
app.use(pools);
app.use(stake);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started default-backend on port: ${port}`);
});

module.exports = {
  app,
};
