//product model requiring
const Product = require('../models/admin/products');


//admin details
const adminCredentials = {
    email: 'admin@123',
    password: 'admin'
};

const adminLogin = (req, res) => {
    res.render('admin/adminLogin'); 
};

const adminVerify = (req, res) => {
    const { email, password } = req.body;

    // For security reasons, you might want to validate the credentials here
    if (email === adminCredentials.email && password === adminCredentials.password) {
        res.redirect('/admin/dashboard');
    } else {
        // Handle invalid credentials
        res.send('Invalid credentials');
    }
};

const dashboard = (req, res) => {
    res.render('admin/dashboard');
};




//product page



const showProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin/products', { products });
    } catch (error) {
        res.status(500).send('Error retrieving products');
    }
};

const renderAddProductForm = (req, res) => {
    res.render('admin/addProduct');
};

const addProduct = async (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? 'img/' + req.file.filename : null;

    if (!image) {
        return res.status(400).send('Image is required');
    }

    const newProduct = new Product({ name, description, image, price });

    try {
        await newProduct.save();
        res.redirect('/admin/products');
    } catch (error) {
        res.status(500).send('Error adding product');
    }
};
const editProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, image, price } = req.body;
    try {
        await Product.findByIdAndUpdate(id, { name, description, image, price });
        res.redirect('/admin/products');
    } catch (error) {
        res.status(500).send('Error editing product');
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.findByIdAndDelete(id);
        res.redirect('/admin/products');
    } catch (error) {
        res.status(500).send('Error deleting product');
    }
};



module.exports = {
    adminLogin,
    adminVerify,
    dashboard,
    showProducts,
    renderAddProductForm,
    addProduct,
    editProduct,
    deleteProduct
};
