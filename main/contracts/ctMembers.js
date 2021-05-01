/* @todo
  * move Member logic out of ctProtocol and into new file called ctMember.js 
  */

router.get('/api/ctProtocol/getMembers', async (req, res) => {
  try {
  //STEP0. GET ALL MEMBERS FROM txMember

  //STEP1. SEND members

  } catch (err) {
    res.status(400).send(err);
  }
}),

router.get('/api/ctProtocol/getMember', async (req, res) => {
  try {
  //STEP0. GET ALL MEMBERS FROM txMember

  //STEP1. SEND members

  } catch (err) {
    res.status(400).send(err);
  }
}),

router.post('/api/ctProtocol/registerNewMember', async (req, res) => {
  try {
  //STEP0. CHECK WHITELIST DB FOR ETH ADDRESS

  //STEP1. REGISTER MEMBER

  } catch (err) {
    res.status(400).send(err);
  }  
});
