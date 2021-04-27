# Default backend

Right now locally it's running on SQLite.
Create an .env file in the top level project directory and set:
* SECRET=anythingyouwantfornow
* PORT=8000
* NODE_ENV=development


You'll need to manually add users to the DB first. Here's a template:
```javascript
const { ApiMember } = require('./models/api/apiMember');
const { TxMember } = require('./models/tx/txMember');

TxMember.create({ ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2', type: 'PERSONAL', createdEpoch: 0 })
ApiMember.create({ ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2', alias: 'z', createdEpoch: 0 })
```

Make sure ethAddress is formatted as a checksum ethereum address. THIS IS REALLY IMPORTANT.

Before saving an ethAddress to DB format it here:
https://ethsum.netlify.app/


To run

```bash
npm start
```
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
