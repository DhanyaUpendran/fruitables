const mongoose = require ('mongoose');

const Schema = mongoose.Schema;

const signupSchema = new Schema({
    Email:{
        type : String,
        required : true,

    },
    Password:{
        type :String,
        required :true,
        
    },
    Username :{
        type :String,
        required:true,
    },
    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number }
    }]
});
 const Signup = mongoose.model('Signup',signupSchema);
module.exports =Signup;