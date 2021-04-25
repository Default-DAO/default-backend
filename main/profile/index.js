const router = require('express').Router(); 

router.put('/api/profile/image', async (req, res) => {
    try {
        
    } catch (err) {
        res.status(400).send(err);
        return;
    }
});


router.put('/api/profile/alias', async (req, res) => {
    try {
        
    } catch (err) {
        res.status(400).send(err);
        return;
    }
});

module.exports = router