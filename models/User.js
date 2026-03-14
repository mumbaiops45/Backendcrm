const mongoose = require('mongoose');
const Schema = mongoose.Schema


const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
         required: true,
        minLength: 6,
    },
    role: {
        type: String,
        enum:['master','manager', 'rep', 'viewer'],
        default: 'rep'
    },
    branch: {
        type: String,
        enum: ['Bangalore', 'Mumbai', 'Mysore','All'],
        default: 'All'
    },
    avatar:{
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    phone: {
        type: String,
        default: ''
    }
}, { timestamps: true })


const User  = mongoose.model('User', userSchema);

module.exports = User;