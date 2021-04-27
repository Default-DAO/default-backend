require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authentication = require('./main/auth');
const profile = require('./main/profile');
const allocation = require('./main/contracts/ctAllocation');
const network = require('./main/contracts/ctNetwork');
const pools = require('./main/contracts/ctPools');
const staking = require('./main/contracts/ctDelegation');

const port = process.env.PORT;
const app = express();

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.use(authentication);
app.use(profile);
app.use(allocation);
app.use(network);
app.use(pools);
app.use(staking);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started default-backend on port: ${port}`);
});

module.exports = {
  app,
};
