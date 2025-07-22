import mongoose from "mongoose";
import bcrypt from 'bcryptjs';


const addressUserSchema = new mongoose.Schema({
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  pobox: { type: String, default: "" } // No function wrapper
});


const StageOrder = mongoose.Schema({
    title : {
        type : String
    } ,
    description : {
        type: String 
    } ,
    Date : {
        type : String
    }
})
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Quantity cannot be less than 1']
    },
    name: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    size: {
        type: String,   
    },
    color: {
        type: String,   
    },
    paymentMethod: {
        type: String,   
    },
    images: [{
        type: String,
        required: true
    }],
    addedAt: {
        type: Date,
        default: Date.now
    }
});


const wishlistItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priceAtPurchase: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    images: [{
        type: [String],
        required: true
    }] ,
    color: {
        type:String ,
       
    } ,
    size: {
        type:String,
        
    } ,
    paymentMethod: {
        type:String 

    } 

});


const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
  street: { type: String},
  city: { type: String },
  state: { type: String},
  country: { type: String},
  pobox: { type: String } 
  }, 
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  }, 

  stage : {
    type : [StageOrder],
    default: [
        {
            title : 'Ordered Placed' , 
            description : "We have recieved your order" ,
            Date : Date.now(),


        }
    ]  ,
      

  } ,
  
  paymentMethod: { 
    type: String,
 
  },
  paymentBank : {
    type: String 
  },
  paymentImage: String,
  orderedAt: { type: Date, default: Date.now }
});


const userSchema = new mongoose.Schema({
    avatar: { type: String , default: 'https://res.cloudinary.com/dqwttbkqo/image/upload/v1748541729/3eubut0v_q50vz5.png'} ,
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    admin: { type: Boolean , default : false},
    phone: {   type: String,required: true, unique: true,} ,
    password: { type: String, required: true },
    active: { type: Boolean, default: false },
    token: { type: String},
    firstLogin: { type: Boolean, default: true },
    googleId: { type: String, unique: true, sparse: true },
    admin: { type: Boolean, default: false },
    address: {type: addressUserSchema,
    default: () => ({
      street: "",
      city: "",
      state: "",
      country: "",
      pobox: ""
    }) } ,
    cart: [cartItemSchema],
    wishlist: [wishlistItemSchema],
    orders: [orderSchema],
}, { timestamps: true });

// Password comparison method    







userSchema.methods.matchPasswords = async function (enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error("Error during password comparison:", error);
        return false;
    }
};

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    } else {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;































   
    

