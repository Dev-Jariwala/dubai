const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    fname : {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
        type: String,
        required: true
    },
    cartProducts: {
        type: Object,
    }
});

const productSchema = new mongoose.Schema({
    img : {
        type: String,
        required: true,
    },
    pname : {
        type: String,
        required: true,
    },
    pdetails : {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
    }

});
const UserData = new mongoose.model("UserData",userSchema);
const ProductData = new mongoose.model("ProductData",productSchema);

module.exports = {UserData,ProductData};