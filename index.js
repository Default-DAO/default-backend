require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const expressJwt = require('express-jwt');
const bodyParser = require('body-parser');
const cors = require('cors');

const authentication = require('./main/auth');
const profile = require('./main/profile');
const liquidity = require('./main/liquidity');
const clout = require('./main/clout');
const value = require('./main/value');

const { jwtAlgorithm } = require('./utils/auth');

const port = process.env.PORT;
const app = express();

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

// all routes require JWT auth except /api/auth/login
app.use(
  expressJwt({
    secret: process.env.SECRET,
    algorithms: [jwtAlgorithm],
  }).unless({
    path: ['/api/auth/login'],
  }),
);

app.use(authentication);
app.use(profile);
app.use(liquidity);
app.use(value);
app.use(clout);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started default-backend on port: ${port}`);
});

module.exports = {
  app,
};
