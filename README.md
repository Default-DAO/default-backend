# Default backend

Right now locally it's running on SQLite.
Create an .env file in the top level project directory and set:
SECRET=anythingyouwantfornow
PORT=8000


You'll need to manually add users to the DB first. Here's a template:
```javascript
const { ApiMember } = require('./models/api/ApiMember');
const { TxMember } = require('./models/tx/TxMember');

TxMember.create({ ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2', type: 'PERSONAL', createdEpoch: 0 })
ApiMember.create({ ethAddress: '0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2', alias: 'z', createdEpoch: 0 })
```

Make sure ethAddress is formatted as a checksum ethereum address.


To run

```bash
npm start
```
