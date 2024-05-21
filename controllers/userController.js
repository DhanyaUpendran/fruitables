

const Signup = require('../models/user/signup')


const signup =  (req, res) => {
    res.render('user/signup'); // Pass the user object to the index view
}

const index = (req, res) => {
    // Check if user is authenticated (logged in)
    if (req.session.user) {
        res.render('user/index', { user: req.session.user }); // Render the index page with user data
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

const cartPage =(req,res)=>{
    if (req.session.user) {
        res.render('cart', { user: req.session.user }); // Render the index page with user data
    } else {
        res.redirect('/login'); // Redirect to signup page if user is not authenticated
    }
}
const shop =(req,res)=>{
// Render the shop.ejs template with shopItems data
if (req.session.user) {
    res.render('user/shop', { user: req.session.user }); // Render the index page with user data
} else {
    res.redirect('/login'); // Redirect to signup page if user is not authenticated
}
}
const shopDetail = (req,res)=>{
    if (req.session.user) {
        res.render('user/shop-detail',{user: req.session.user});
    }
    else{
        res.redirect('/login');
    }
}
module.exports = {
    index,
    signup,
    saveSignup,
    login,
    loginVerify,
    logout,
    cartPage,
    shop,
    shopDetail
}