const express = require('express');
const path = require('path');
const userController = require('../controllers/userController');
const razorpay = require("../middleware/razorpay");



const route = express.Router();

route.use(express.static(path.join(__dirname, '../views/user')));

route.get('/',userController.signup)
route.get('/home',userController.index)
route.get('/login',userController.login)
route.get('/logout',userController.logout)
route.get('/cart',userController.cartPage)
route.get('/shop',userController.shop)
route.get('/shop-detail',userController.shopDetail)
route.get('/checkout',userController.getCheckOut)
route.get('/ordersuccess',userController.getOrderSuccess)
route.get("/myOrders", userController.getOrder)
route.get('/checkout/razorpaycheckout', userController.razorpayCheckout);



route.post('/', userController.saveSignup)
route.post('/login',userController.loginVerify)
route.post('/cart/add',userController.getCart)
route.post('/cart/update/:productId', userController.cartEdit)
route.post('/cart/remove/:productId', userController.cartRemove)
route.post('/checkout',userController.postCheckOut)
route.post('/checkout/verify-payment',userController.paymentVerify)

module.exports = route;