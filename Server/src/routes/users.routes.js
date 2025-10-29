const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.create);
router.post('/bulk', userController.bulkCreate);
router.get('/', userController.list);
router.get('/all', userController.listAll);
router.get('/export', userController.exportToExcel);
router.patch('/:userKey', userController.update);
router.delete('/:userKey', userController.remove);

module.exports = router;


