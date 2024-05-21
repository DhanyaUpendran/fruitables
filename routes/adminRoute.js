const express = require('express');
const path = require('path');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/multer');

const route = express.Router();

route.use(express.static(path.join(__dirname, '../views/admin')));

route.get('/', adminController.adminLogin);
route.post('/', adminController.adminVerify)
route.get('/dashboard',adminController.dashboard)
route.get('/products', adminController.showProducts);
route.get('/products/add', adminController.renderAddProductForm); 
route.post('/products/add', upload,adminController.addProduct);
route.post('/products/edit/:id', adminController.editProduct);
route.post('/products/delete/:id', adminController.deleteProduct);


module.exports = route;
