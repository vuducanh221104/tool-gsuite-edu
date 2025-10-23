const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.create);
router.get('/', userController.list);
router.get('/all', userController.listAll);
router.patch('/:userKey', userController.update);
router.delete('/:userKey', userController.remove);

module.exports = router;


