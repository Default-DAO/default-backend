# Default backend

Create an .env file in the top level project directory and set:
* SECRET=anythingyouwantfornow
* PORT=8000
* NODE_ENV=development
* DATABASE_URL=postgresql://{user}:{password}@localhost:5432/default_db?schema=public


To get it running:
```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run start
```

Unit tests are run in docker-compose. 

To be able to run the unit tests download docker desktop from here:
https://www.docker.com/products/docker-desktop

Then install docker-compose:
```bash
brew install docker-compose
```

Then run:
```bash
npm run test
```


You can also run unit tests against your local database but this will clear all data
from your local db.

Heres the command to run unit tests outside of docker. Warning it will delete everything in
your databse (hence docker):
```bash
npm run containertests
```


You'll need to manually add users to the DB first to test endpoints. Here's a template:
```javascript
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.txMember.create({
  data: {
    ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2',
    type: 'PERSONAL',
    createdEpoch: 0,
    alias: 'z',
  }
});

prisma.apiMember.create({
  data: {
    ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2',
    alias: 'z',
  }
});

const apiMember = prisma.apiMember.findUnique({
  where: { ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2' },
});
```

Make sure ethAddress is formatted as a checksum ethereum address. THIS IS REALLY IMPORTANT.

Before saving an ethAddress to DB format it here:
https://ethsum.netlify.app/


# Endspoints
- ### auth
| Endpoint  | Type | Description
| ------------- | ------------- | ------------- |
| /api/auth/login  | Get  |   |
| /api/auth/login  | Post  |   |
| /api/auth/secret  | Get  |   |

- ### liquidity
| Endpoint  | Type | Description
| ------------- | ------------- | ------------- |
| /api/liquidity  | Get  |   |
| /api/liquidity/add  | Post  |   |
| /api/liquidity/swap  | Post  |   |
| /api/liquidity/stake  | Post  |   |

- ### clout
| Endpoint  | Type | Description
| ------------- | ------------- | ------------- |
| /api/clout  | Get  |   |
| /api/clout  | Post  |   |

- ### value
| Endpoint  | Type | Description
| ------------- | ------------- | ------------- |
| /api/value  | Get  |   |
| /api/value  | Post  |   |

- ### profile
| Endpoint  | Type | Description
| ------------- | ------------- | ------------- |
| /api/profile/image  | Put  |   |
| /api/profile/alias  | Put  |   |


# Structure
### config
Contains reusables keys such as endpoints
### db
Configuration of the app level database
### main
Contains endpoints and main functionality of the app.
- #### auth
login, jwt autentication, registration, 
- #### clout
give clout, browse clout, clout rewards
- #### liquidity
add liquidity, swap liquidity, stake tokens, mint / distribute tokens
- #### profile
change alias, change photo
- #### value
give value, browse values, value rewards

### models
Contains models for the app level database

### utils
Contains helper functions that can be reused throughout the app
