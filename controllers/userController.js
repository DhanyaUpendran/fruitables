

const Signup = require('../models/user/signup')
const Product = require('../models/admin/products');
const CartItem= require('../models/user/cartItem');
const Order= require('../models/user/order');
const razorpay = require("../middleware/razorpay");
const crypto = require('crypto');
require('dotenv').config();




const signup =  (req, res) => {
    res.render('user/signup'); 
}

const index = (req, res) => {
    // Check if user is authenticated (logged in)
    if (req.session.user) {
        res.render('user/index', { user: req.session.user}); 
    } else {
        res.redirect('/signup'); 
    }
};
 
const saveSignup = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await Signup.findOne({ Email: email });
        if (existingUser) {
            return res.render('user/signup', { error: 'Email already exists. Please use a different email.' });
        }

        // Create a new user instance
        
        const newSignup = new Signup({
            Email: email,
            Password: password,
            Username: username
        });

      
        await newSignup.save();
        console.log('User successfully signed up:', newSignup);

        
        res.redirect('/login');
    } catch (error) {
        console.log('Error saving signup data:', error);
        res.status(500).json({ error: 'Error saving signup data' });
    }
};

const login=  (req,res)=>{
    res.render('user/login');
}
const loginVerify = async (req, res) => {
    const { email, password } = req.body;

    try {
       
        const user = await Signup.findOne({ Email: email, Password: password });

        if (user) {
           
            req.session.user = {
                _id: user._id,
                username: user.Username,
                email: user.Email
               
            };
            console.log('User authenticated:', req.session.user);
            res.redirect('/home'); 
        } else {
           
            res.render('user/login', { error: 'Invalid email or password' });
        }
    } catch (error) {
        console.log('Error verifying login:', error);
        res.status(500).json({ error: 'Error verifying login' });
    }
};

const logout =  (req, res) => {
    req.session.destroy();
    res.redirect('/login'); 
}




const shop = async (req, res) => {
    const ITEMS_PER_PAGE = 6;
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1;

    try {
        const totalProducts = await Product.countDocuments({});
        const products = await Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        res.render('user/shop', {
            user: req.session.user,
            products,
            currentPage: page,
            totalPages,
           
        });
    } catch (error) {
        res.status(500).send('Error retrieving products');
    }
};

const shopDetail = (req,res)=>{
    if (req.session.user) {
        res.render('user/shop-detail',{user: req.session.user});
    }
    else{
        res.redirect('/login');
    }
}

//--------------------------------------cart------------------------------------//

const cartPage = async (req, res) => {
    try {
        
        const userId = req.session.user;
       
        if (!userId) {
            return res.status(401).send('User not authenticated');
           
        }

        const user = await Signup.findById(userId).populate('cart.productId');

        if (!user) {
            return res.status(404).send('User not found');
        }
        const cartItem = user.cart
        .filter(item => item.productId)
        .map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.image,
            quantity: item.quantity
        }));
            
    
        res.render('user/cart', { user, cartItem});
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Error fetching cart');
    }
};



const getCart = async (req, res) => {
    const { productId, quantity } = req.body;

    try {
      
        const userId = req.session.user;
        const user = await Signup.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the product in the user's cart
        const cartItem = user.cart.find(item => item.productId && item.productId.equals(productId));

        if (cartItem) {
            // If the product is already in the cart, update the quantity
            cartItem.quantity += quantity;
        } else {
            // If the product is not in the cart, add it with the provided quantity
            user.cart.push({ productId, quantity }); 
        }
        await user.save();

       
        res.redirect('/cart'); 
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding the product to the cart' });
    }
};


const cartEdit= async (req,res) =>{
    const { productId } = req.params;
    const { action } = req.body;

    try {
      
        const userId = req.session.user;
        const user = await Signup.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
       
       if (!user.cart) {
        user.cart = { items: [] }; // Initialize cart if it doesn't exist
    }

    if (!user.cart.items) {
        user.cart.items = [];
    }

  
    const cartItem = user.cart.find(item => item.productId && item.productId.equals(productId));

        if (!cartItem) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        // Adjust the quantity based on the action
        if (action === 'increase') {
            cartItem.quantity += 1;
        } else if (action === 'decrease' && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
        } else if (action === 'decrease' && cartItem.quantity === 1) {
            // Optionally, remove the item if the quantity reaches 0
            user.cart.items = user.cart.items.filter(item => item.productId && item.productId.equals(!productId));
        }

      
        await user.save();

        return res.redirect('/cart'); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }

};
const cartRemove = async (req, res) => {
    try {
        const userId = req.session.user; 
        const productId = req.params.productId; // Get the productId from the URL parameter

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

    
        const user = await Signup.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the index of the product in the user's cart, ensuring productId exists
        const index = user.cart.findIndex(item => item.productId && item.productId.equals(productId));

        if (index !== -1) {
           
            user.cart.splice(index, 1);
            await user.save(); 
        }

      
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ error: 'An error occurred while removing the product from the cart' });
    }
};

//--------------------------------------checkOut------------------------------------//

const getOrderSuccess = (req, res) => {
    if (req.session.user) {
        res.render('user/ordersuccess', { user: req.session.user });
    } else {
        res.redirect('/checkout');
      
    }
};

const razorpayCheckout = (req, res) => {
    if (req.session.user) {
        res.render('user/razorpaycheckout', { user: req.session.user });
    } else {
        res.redirect('/checkout');
    }
};



// Place this helper function outside the controller functions but inside the same file
function verifyRazorpaySignature(paymentId, orderId, signature) {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
}


const getCheckOut = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(400).json({ error: 'User not logged in' });
        }

        const user = await Signup.findById(userId).populate('cart.productId');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cartItems = user.cart
        .filter(item => item.productId) 
        .map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            image:item.productId.image,
            price: item.productId.price,
            quantity: item.quantity
        }));

        const cartTotal = cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        res.render('user/checkout', { user, cartItems,cartTotal });
    } catch (error) {
        console.error("Error fetching checkout page:", error);
        res.status(500).send('Error fetching checkOut');
    }
};


    


const postCheckOut = async (req, res) => {
    console.log("postCheckOut triggered");

    const { firstName, lastName, company, address, city, country, postcode, phone, email, paymentMethod, cartTotal } = req.body;

    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).redirect('/login');
        }

        const user = await Signup.findById(userId).populate('cart.productId');

        if (!user.cart || user.cart.length === 0) {
            return res.status(400).send("Cart is empty");
        }

        const cartItems = user.cart.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            image: item.productId.image,
            quantity: item.quantity,
            price: item.productId.price
        }));

        // If paymentMethod is Razorpay, create an order in Razorpay
        if (paymentMethod === 'razorpay') {
            const razorpayOrder = await razorpay.orders.create({
                amount: cartTotal * 100,  // Amount in smallest currency unit (paise)
                currency: "INR",
                receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
                payment_capture: 1  // Auto-capture payment
            });
            

            console.log("Razorpay order created:", razorpayOrder);

            res.render('user/razorpayCheckout', { 
                user: req.session.user, 
                razorpayOrderId: razorpayOrder.id,  
                cartTotal,
                razorpayKey:process.env.RAZORPAY_KEY_ID  
            });

             
        }

        // If payment method is not Razorpay, proceed with normal order creation logic
        const newOrder = new Order({
            user: userId,
            products: cartItems,
            billingDetails: {
                firstName,
                lastName,
                company,
                address,
                city,
                country,
                postcode,
                phone,
                email
            },
            paymentDetails: {
                method: paymentMethod,
                status: 'Pending'
            },
            totalAmount: cartTotal
        });

        await newOrder.save();

        // Clear the user's cart
        user.cart = [];
        await user.save();

        return res.redirect('/ordersuccess');
    } catch (error) {
        console.error("Error during checkout:", error);
        res.redirect('/checkout');
    }
};
const paymentVerify = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify payment signature (use Razorpay's library or custom verification)
    const isValid = verifyRazorpaySignature(razorpay_payment_id, razorpay_order_id, razorpay_signature);

    if (isValid) {
        // Update order status in the database to 'Paid'
        await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { 'paymentDetails.status': 'Paid' });

        return res.json({ success: true });
    } else {
        return res.json({ success: false });
    }
};



// order viewing page---------------------------------//

const getOrder = async (req, res) => {
    try {
        const { user: userId } = req.session;
        if (!userId) {
            return res.status(400).json({ error: 'User not logged in' });
        }

        // Fetch orders and populate the productId field
        const orders = await Order.find({ user: userId })
            .populate({
                path: 'products.productId',
                strictPopulate: false 
            });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: 'No orders found' });
        }

        const orderDetails = orders.map(order => {
            const { _id: orderId, products, totalAmount, date, status } = order;

            const productDetails = products.map(item => {
                // Check if productId exists before destructuring
                if (!item.productId) {
                    console.error('Product ID missing for item:', item);
                    return { productId: null, name: 'Product not found', image: '', price: 0, quantity: item.quantity };
                }

                // Safely destructure if productId exists
                const { _id: productId, name, image, price } = item.productId;
                const { quantity } = item;

                return { productId, name, image, price, quantity };
            });

            return {
                orderId,
                products: productDetails,
                totalAmount,
                date,
                status
            };
        });

        res.render('user/myOrders', { user: req.session.user, orderDetails });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send('Error fetching orders');
    }
};














  
  
        




module.exports = {
    index,
    signup,
    saveSignup,
    login,
    loginVerify,
    logout,
    shop,
    shopDetail,
    cartPage,
    getCart,
    cartEdit,
    cartRemove,
    getCheckOut,
    postCheckOut,
    getOrderSuccess,
    getOrder,
    razorpayCheckout,
    paymentVerify
    
}