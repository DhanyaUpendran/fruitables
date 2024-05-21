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
    }
});
 const Signup = mongoose.model('Signup',signupSchema);
module.exports =Signup;
