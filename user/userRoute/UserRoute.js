import express from "express";
import jwt from "jsonwebtoken";
import asyncHandler from 'express-async-handler';
import User from '../userModel/userModel.js'
import dotenv from 'dotenv'

import { sendPasswordReset } from "../../authMiddleware/sendPasswordResetEmail.js";
import Product from "../../product/productModel/ProductModel.js";
import { protect } from "../../authMiddleware/protectRoute.js";
dotenv.config()
const userRoute = express.Router()

const genToken = (id) => {
    if (!process.env.TOKEN_SECRET) {
        throw new Error('TOKEN_SECRET not configured');
    }
    return jwt.sign({ id }, process.env.TOKEN_SECRET, {
        expiresIn: '7d' // Recommended to add expiration
    });
};



const loginUser = asyncHandler(async(req , res)=>{

    const {email , password} = req.body;
    const user = await User.findOne({email}) 
    if(!user){
        return res.status(401).json({message:'Invalid email or password'}) } 

    const duration = 3000 ; 
    let responseSent = false ;

    const timeOut = setTimeout(()=>{
        if(!responseSent){
            responseSent = true ;
            res.status(504). json('Login time out')
        }
    } , duration)



    if (user && (await user.matchPasswords(password))) {  
        
       
        user.firstLogin = false;
        await user.save();
        if(!responseSent) {
            clearTimeout(timeOut)
            res.json({
                _id: user._id,
                name: user.name,
                avatar:user.avatar ,
                admin: user.admin,
                email: user.email,
                firstLogin: user.firstLogin,
                admin: user.admin,
                active: user.active,
                token: genToken(user?._id),
                Date: user.Date,
                phone:user.phone,
                address:user.address
                
            });
        }
    
    } else {
        clearTimeout(timeOut)
        res.status(401).json({ message: "Invalid Email or Password" });
        throw new Error("Invalid credentials");
    }
    


})





// registerUser function
const registerUser = asyncHandler(async (req, res) => {
    const { name, phone ,email, password} = req.body;

    // Validate required fields
    if (!name || !email || !phone|| !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Verify token secret exists before any operations
        if (!process.env.TOKEN_SECRET) {
            throw new Error('Server configuration error - missing token secret');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({ name,phone , email, password });
        const newToken = genToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            avatar: user.avatar ,
            email: user.email,
            admin: user.admin,
            token: newToken,
            firstLogin: user.firstLogin,
            admin: user.admin,
            active: user.active,
            Date: user.Date,
            orders: user.orders,
            phone:user.phone ,
            address:user.address
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});








const editProfile = async(req , res)=>{

    const {name , email , phone } = req.body
  

    try { 
        
        const user = await User.findById(req.user.id).select('name email phone avatar _id token firstLogin address phone admin active Date');
        
        user.name = name 
        user.email = email 
        user.phone = phone 
        
    
        const response = await user.save()
    
        res.status(200).json(response)
        
    } catch (error) {
        res.status(500).json({
            message:'server error'
        })
    }
  
}




const editAddres = async(req , res)=>{

    const {street , city , state , country , pobox} = req.body


    try {
        const user = await User.findById(req.user.id)
        
        const newAddress = {street:street , city:city , state:state , country:country , pobox:pobox}
        user.address = newAddress
        
    
        await user.save()
    
        res.status(200).json(user.address)
        
    } catch (error) {
        res.status(500).json({
            message:'server error'
        })
    }
  
}


const deleteAddress = async (req, res) => {

    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } 
        const empty = {
            street: "",
            city: "",
            state: "",
            country: "",
            pobox: ""
        }
        user.address = empty;
        await user.save();
        res.status(200).json({ message: 'Address deleted successfully', address: user.address });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error' });  
    }
};

 

const otpStore = new Map();

const passwordResetRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;
      
    try {
        const user = await User.findOne({email: email});
        if (!user) {
            return res.status(404).json({message : 'User not found in our database.'});
        }
        
        // Generate new OTP for each request
        const OTP = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Store OTP with user's email and expiration (5 minutes)
        otpStore.set(email, {
            otp: OTP,
            expiresAt: Date.now() + 300000 // 5 minutes
        });
        
        await sendPasswordReset({ email: user.email, name: user.name, OTP: OTP });
        res.status(200).json({ message: `A recovery email has been sent to ${email}` });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({message :'Internal server error. Please try again later.'});
    }
});


const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    
    try {
        const otpData = otpStore.get(email);

        console.log(otpData)
        
        if (!otpData || otpData.otp !== otp) {
            return res.status(400).json({message :'Invalid OTP'});
        }
        
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({message :'OTP has expired'});
        }
        
        
        const token = jwt.sign(
            { id: email }, 
            process.env.TOKEN_SECRET,
            { expiresIn: '15m' }
        );
        
        
        otpStore.delete(email);
        
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({message :'Internal server error. Please try again later.'});
    }
});

const passwordReset = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findOne({ email: decoded.id });
        
        if (!user) {
            return res.status(404).json({message : 'User not found'});
        }
        
        user.password = password;
        await user.save();
        
        res.status(200).json({ message: 'Password has been successfully updated' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(401).json({message :'Password reset failed. Token may be invalid or expired.'});
    }
});




const signUpUser = asyncHandler(async (req, res) => {
    const { name, phone, email, password } = req.body;

    // 1. Fast validation first
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }

    try {
        // 2. Check user existence FIRST with indexed email
        const userExists = await User.findOne({ email }).select('_id').lean();
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 3. Create user with only essential fields
        const user = await User.create({ 
            name, 
            phone, 
            email, 
            password 
        });

        // 4. Generate token while user is being created (parallel)
        const newToken = genToken(user._id);

       
        res.status(201).json({
            _id: user._id,
            name: user.name,
            avatar:user.avatar ,
            email: user.email,
            phone: user.phone,
            token: newToken
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed',
        });
    }
});




const updateProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    user.avatar = req.body.profilePicture;
    await user.save();

    res.status(200).json({
      message: 'Profile picture updated',
      profilePicture: user.avatar
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile picture',
      error: error.message 
    });
  }
};







const addToCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // 1. Input validation
        if (!userId || !productId) {
            return res.status(400).json({ message: 'Missing userId or productId' });
        }

        // 2. Fetch product (lean for performance)
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 3. Atomic update using $addToSet (prevents duplicates)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    cart: {
                        product: product._id,
                         
                        name: product.get('name'), // Explicitly access fields
                        price: product.get('price') || 0 , // Ensures correct value
                        subtitle: product.subtitle || "No subtitle",
                     
                        images: product.images?.[0] || "default-image.jpg",
                        size: 'S', // Default or from request
                        color: 'White', // Default or from request
                        quantity: 1,
                        addedAt: new Date()
                    }
                }
            },
            { new: true } // Return updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 4. Success response
        return res.json({
            message: 'Product added to cart successfully',
            cart: updatedUser.cart
        });

    } catch (error) {
        console.error('Cart error:', error);
        return res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};







const deleteCartItem = async (req, res) => {
    try {
        const { userId, productId } = req.body;


        if (!userId || !productId) {
            return res.status(400).json({ message: 'Missing userId or productId' });
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

  
        const updatedCart = user.cart.filter(
            item => item.product.toString() !== productId.toString()
        );


        user.cart = updatedCart;
        await user.save();


       res.json({ 
            message: 'Item deleted successfully',
            cart: user.cart 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: 'Error deleting item',
            error: error.message 
        });
    }
};



const deleteWishlistItem = async (req, res) => {
    try {
        const { userId, productId } = req.body;


        if (!userId || !productId) {
            return res.status(400).json({ message: 'Missing userId or productId' });
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

  
        const updatedWishlist = user.wishlist.filter(
            item => item.product.toString() !== productId.toString()
        );


        user.wishlist = updatedWishlist
        await user.save();


       res.json({ 
            message: 'Item deleted successfully',
            wishlist: user.wishlist
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: 'Error deleting item',
            error: error.message 
        });
    }
};






userRoute.route('/login').post(loginUser);
userRoute.route('/cart').post(addToCart);
userRoute.route('/deletecart').delete(deleteCartItem);
userRoute.route('/deleteWishlist').delete(deleteWishlistItem);
userRoute.route('/register').post(registerUser);
userRoute.route('/passwordResetRequest').post(passwordResetRequest) 
userRoute.route('/profilepicture').put(protect , updateProfilePicture)

userRoute.route('/OTPrequest').post(verifyOTP) 
userRoute.route('/passwordReset').post(passwordReset);

userRoute.route('/registercheck').post(signUpUser);
userRoute.route('/editProfile').put(protect ,editProfile);


userRoute.route('/editAddress').put(protect ,editAddres);
userRoute.route('/deleteAddress').put(protect ,deleteAddress);

export default userRoute;