

const Signup = require('../models/user/signup')
const Product = require('../models/admin/products');
const CartItem= require('../models/user/cartItem');
const Order= require('../models/user/order');

const signup =  (req, res) => {
    res.render('user/signup'); // Pass the user object to the index view
}

const index = (req, res) => {
    // Check if user is authenticated (logged in)
    if (req.session.user) {
        res.render('user/index', { user: req.session.user}); // Render the index page with user data
    } else {
        res.redirect('/signup'); // Redirect to signup page if user is not authenticated
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

        // Save the new user to the database
        await newSignup.save();
        console.log('User successfully signed up:', newSignup);

        // Redirect to the login page after successful signup
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
        // Check if email and password match a document in the database
        const user = await Signup.findOne({ Email: email, Password: password });

        if (user) {
            // Store user data in session
            req.session.user = {
                _id: user._id,
                username: user.Username,
                email: user.Email
                // Add any other user data you want to store in the session
            };
            console.log('User authenticated:', req.session.user);
            res.redirect('/home'); // Redirect to the home page after successful login
        } else {
            // Invalid credentials, render login page with error message
            res.render('user/login', { error: 'Invalid email or password' });
        }
    } catch (error) {
        console.log('Error verifying login:', error);
        res.status(500).json({ error: 'Error verifying login' });
    }
};

const logout =  (req, res) => {
    req.session.destroy();
    res.redirect('/login'); // Redirect to login page after logout
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
        // Access the user ID from the session
        const userId = req.session.user;
       
        if (!userId) {
            return res.status(401).send('User not authenticated');
           
        }

        // Fetch the user from the database and populate the cart
        const user = await Signup.findById(userId).populate('cart.productId');

        if (!user) {
            return res.status(404).send('User not found');
        }
        const cartItem = user.cart
        .filter(item => item.productId) // Ensure productId is populated
        .map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.image,
            quantity: item.quantity
        }));
            
        // console.log('Populated Cart:', user.cart);
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

        // Redirect to the cart page or send a success response
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
       // Ensure that the user has a cart and items array
       if (!user.cart) {
        user.cart = { items: [] }; // Initialize cart if it doesn't exist
    }

    if (!user.cart.items) {
        user.cart.items = []; // Initialize items array if it doesn't exist
    }

    // Find the cart item associated with the productId
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

        // Save the updated user cart
        await user.save();

        return res.redirect('/cart'); // Redirect to cart page after update
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }

};
const cartRemove = async (req, res) => {
    try {
        const userId = req.session.user; // Access the user ID from the session
        const productId = req.params.productId; // Get the productId from the URL parameter

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Find the user by ID
        const user = await Signup.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the index of the product in the user's cart, ensuring productId exists
        const index = user.cart.findIndex(item => item.productId && item.productId.equals(productId));

        if (index !== -1) {
            // Remove the item from the cart using splice
            user.cart.splice(index, 1);
            await user.save(); // Save the updated cart
        }

        // Redirect to the cart page or send a success response
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
        .filter(item => item.productId) // Ensure productId is populated
        .map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            image:item.productId.image,
            price: item.productId.price,
            quantity: item.quantity
        }));

        res.render('user/checkout', { user, cartItems });
    } catch (error) {
        console.error("Error fetching checkout page:", error);
        res.status(500).send('Error fetching checkOut');
    }
};


    


const postCheckOut = async (req, res) => {
    console.log("postCheckOut triggered");
    console.log("Session User:", req.session.user);
    
    const { firstName, lastName, company, address, city, country, postcode, phone, email, paymentMethod, cartTotal } = req.body;
    console.log('Received form data:', req.body);

    try {
        const userId = req.session.user;
        if (!userId) {
            console.log("User is not logged in");
            return res.status(401).redirect('/login'); n
        }

        const user = await Signup.findById(userId).populate('cart.productId');
        console.log("User found:", user);
        console.log("Cart items:", user.cart);

        if (!user.cart || user.cart.length === 0) {
            console.log("Cart is empty");
            return res.status(400).send("Cart is empty");
        }

        const cartItems = user.cart.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            image: item.productId.image,
            quantity: item.quantity,
            price: item.productId.price
        }));

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

        console.log("New order:", newOrder);

        // Save the order to the database
        await newOrder.save();
        console.log("Order saved");

        // Clear the user's cart after the order is placed
        user.cart = [];
        await user.save();

        // Redirect to a success page or show confirmation
        res.redirect('/ordersuccess');
    } catch (error) {
        console.error("Error during checkout:", error);
        res.redirect('/checkout');
        console.log("order failed");
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
    getOrderSuccess
   
    
}