const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true,
    },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    billingDetails: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        company: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        postcode: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    paymentDetails: {
        method: { type: String, required: true },
        status: { type: String, default: 'Pending' }
    },
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Placed' } 
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
