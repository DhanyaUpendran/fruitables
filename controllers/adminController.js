//product model requiring
const Product = require('../models/admin/products');
const Order = require('../models/user/order');



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
    const { name, category,description, price } = req.body;
    const image = req.file ? 'img/' + req.file.filename : null;

    if (!image) {
        return res.status(400).send('Image is required');
    }

    const newProduct = new Product({ name, description,category, image, price });

    try {
        await newProduct.save();
        res.redirect('/admin/products');
    } catch (error) {
        res.status(500).send('Error adding product');
    }
};
const editProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, price } = req.body;
    let image;

    // If a new image is uploaded, use it. Otherwise, keep the old image.
    if (req.file) {
        image = 'img/' + req.file.filename;
    } else {
        const product = await Product.findById(id);
        image = product.image;
    }

    try {
        await Product.findByIdAndUpdate(id, { name, description, category, image, price });
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


//Order page

const getOrdersAdmin = async (req, res) => {
    try {
        // Fetch all orders with user details
        const orders = await Order.find().populate('user').populate('products.productId');
        res.render('admin/orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
};



const status= async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.status;

        // Find the order and update the status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        order.status = newStatus;
        await order.save();

        // Redirect back to the orders page
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
}




module.exports = {
    adminLogin,
    adminVerify,
    dashboard,
    showProducts,
    renderAddProductForm,
    addProduct,
    editProduct,
    deleteProduct,
    getOrdersAdmin,
    status
};
