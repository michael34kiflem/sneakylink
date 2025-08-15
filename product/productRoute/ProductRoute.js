import express from 'express'
import Product from '../productModel/ProductModel.js'
import User from '../../user/userModel/userModel.js'
import {protect} from '../../authMiddleware/protectRoute.js'
import mongoose from 'mongoose'
const ProductRoute = express.Router()




const productData = async(req ,res)=>{
    const product = await Product.find({})
    res.json({message : "sucess" , data : product})
  
}


const fetchSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'single product', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


  export const fetchCartProduct = async (req, res) => {
    const {id} = req.body;
    const user = await User.findById(id);
    try {
      if (user) {
        const cart = await user.cart
        res.json(cart);
      } else {
        res.status(404).json({ message: "cart not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };


  
  export const addToCart = async (req, res) => {
  try {
    const { productId, userId,  quantity , size , color } = req.body;
    
    // Early validation checks
    if (!productId || !userId) {
      return res.status(400).json({
        message: 'Both productId and userId are required'
      });
    }


  
     if( !quantity || !size ||!color){
      return  res.status(404).json({
        status : 'error' ,
        message : 'Please select the Size , Quantity , Color'
      })
     }

    const [product, user] = await Promise.all([
      Product.findById(productId).select('name subtitle images price').lean(),
      User.findById(userId).select('cart')
    ]);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find existing item more efficiently
    const existingItem = user.cart.find(
      item => item.product.toString() === productId && 
              item.size === size && 
              item.color === color
    );

    let updatedCart;
    if (existingItem) {
      updatedCart = user.cart.map(item => 
        item._id.equals(existingItem._id) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      updatedCart = [
        ...user.cart,
        {
          product: productId, 
          quantity:quantity || 1, 
          name: product.name,
          subtitle: product.subtitle,
          images: product.images,
          price: product.price,
          size: size,
          color: color,
     
        }
      ];
    }


    await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );
   
    const cartProduct = {
          product: productId, 
          quantity:quantity || 1, 
          name: product.name,
          subtitle: product.subtitle,
          images: product.images,
          price: product.price,
          size: size,
          color: color,
    }
    res.status(200).json({ cart: cartProduct});

  } catch (error) {
    console.error('Cart Error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}



export const fetchFavoriteProduct = async (req, res) => {
  const {id} = req.params;
  const user = await User.findById(id);
  try {
    if (user) {
      const wishlist = await user.wishlist
      res.json(wishlist);
    } else {
      res.status(404).json({ message: "cart not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const addToFavorite = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    // Early validation
    if (!productId || !userId) {
      return res.status(400).json({ 
        message: "Both productId and userId are required" 
      });
    }

    // Parallel lookups with optimized queries
    const [product, user] = await Promise.all([
      Product.findById(productId).select('name subtitle images price').lean(),
      User.findById(userId).select('wishlist')
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Efficient duplicate check
    const productExists = user.wishlist.some(
      item => item.product.toString() === productId
    );

    if (productExists) {
      return res.status(409).json({  // 409 Conflict is more appropriate for duplicates
        message: "Product already exists in wishlist",
        wishlist: user.wishlist
      });
    }

    // Create new wishlist array instead of modifying in place
    const updatedWishlist = [
      ...user.wishlist,
      {
        product: productId, // Use the ID directly
        name: product.name,
        subtitle: product.subtitle,
        images: product.images || [],
        price: product.price
      }
    ];

    // Optimized update - only update the wishlist field
    await User.updateOne(
      { _id: userId },
      { $set: { wishlist: updatedWishlist } }
    );

    return res.status(200).json({
      message: "Product added to wishlist successfully",
      wishlist: updatedWishlist
    });

  } catch (error) {
    console.error("Wishlist Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


const deleteFromFavorite = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Use only the URL parameter
    user.wishlist = user.wishlist.filter(item => 
      item.product?.toString() !== productId
    );

    const updatedUser = await user.save();
    res.status(200).json({
      message: "Product removed from wishlist",
      newCart: updatedUser
    });
  } catch (error) {
    console.error('wishlist deletion error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};


const deleteFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Use only the URL parameter
    user.cart = user.cart.filter(item => 
      item.product?.toString() !== productId
    );

    const updatedUser = await user.save();
    res.status(200).json({
      message: "Product removed from cart",
      newCart: updatedUser
    });
  } catch (error) {
    console.error('Cart deletion error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};


const addQuantity = async (req, res) => {
  try {
    const { productId, userId} = req.body;

    // Early validation
    if (!productId || !userId) {
      return res.status(400).json({ 
        message: "productId, userId  are required" 
      });
    }

    // Find the user and the product
    const user = await User.findById(userId);
    const product = await Product.findById(productId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the item in the user's cart
    const cartItem = user.cart.find(item => item.product.toString() === productId);

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update the quantity
    cartItem.quantity += 1;

    await user.save();

    res.status(200).json({
      message: "Quantity updated successfully",
      cart: user.cart
    });

  } catch (error) {
    console.error('Error adding quantity:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};


const decreaseQuantity = async (req, res) => { 
  try {
    const { productId, userId } = req.body;

    // Early validation
    if (!productId || !userId) {
      return res.status(400).json({ 
        message: "productId and userId are required" 
      });
    }

    // Find the user and the product
    const user = await User.findById(userId);
    const product = await Product.findById(productId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the item in the user's cart
    const cartItem = user.cart.find(item => item.product.toString() === productId);

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Decrease the quantity, ensuring it doesn't go below 1
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      await user.save();
      res.status(200).json({
        message: "Quantity decreased successfully",
        cart: user.cart
      });
    } else {
      res.status(400).json({ message: "Quantity cannot be less than 1" });
    }

  } catch (error) {
    console.error('Error decreasing quantity:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
}


const orderProduct = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } 

  

        const { orderItems, shippingAddress, paymentMethod } = req.body;
        console.log('value is' ,orderItems , shippingAddress , paymentMethod)
        const product = await Product.findById(orderItems[0]?.product);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const orderItem = {
            product: product._id,
            quantity: orderItems?.quantity,
            priceAtPurchase: product.price,
            name: product.name,
            images: product.image,
            subtitle: product.subtitle,
            color: orderItems?.color,
            size: orderItems?.size,
        };
        
        const newOrder = {
            items: [orderItem],
            totalAmount: product.price * (orderItems?.quantity || 1),
            paymentBank: orderItems?.paymentBank || 'cash',
            paymentImage: orderItems?.paymentImage || 'cash',
            paymentMethod: paymentMethod, // Assuming all items have the same payment method
            status: 'pending', // Added quotes around 'pending'
            shippingAddress: shippingAddress,
        };
        
        user.orders.push(newOrder); // Changed from user.order to user.orders to match your schema
        await user.save();
        
        res.status(201).json(newOrder);
        
    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({ message: 'failed to place order', error: error.message });
    }
};



const fetchOrder = async(req , res) => {
    const user = await User.findById(req.user.id)
     
    try {
        res.status(200).json({message:'status 200' , order: user.orders})
    } catch (error) {
        res.status(500).json({message: error})
    }
   
}







const orderCartProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { cartItems, shippingAddress, paymentMethod , paymentImage , paymentBank } = req.body;
        
        const validProducts = await Promise.all(
            cartItems.map(async (item) => {
                const product = await Product.findById(item.product);
                if (!product || product.price !== item.price) return null;
                return {
                    product: product._id,
                    quantity: item.quantity || 1,
                    priceAtPurchase: product.price,
                    name: product.name,
                    subtitle: product.subtitle,
                    images: product.images,
                    color: item.color,
                    size: item.size
                };
            })
        );

        const validOrderItems = validProducts.filter(Boolean);
        if (!validOrderItems.length) {
            return res.status(400).json({ message: 'No valid products in cart' });
        }

        const totalAmount = validOrderItems.reduce(
            (sum, item) => sum + (item.priceAtPurchase * item.quantity || 1), 0
        );

        const newOrder = {
            items: validOrderItems,
            totalAmount,
            shippingAddress: shippingAddress,
            status: 'pending', 
            paymentBank:paymentBank || 'cash' ,
            paymentMethod: paymentMethod || 'cash', // Default to 'cash' if not provided
            paymentImage: paymentImage || 'bank', // Assuming all items have the same payment method
            orderedAt: new Date().toISOString()
        };

        user.orders.push(newOrder);
        user.cart = [];
        await user.save();

        res.status(201).json({ order: newOrder }); // Fixed response format
    } catch (error) {
        console.error('Cart order error:', error);
        res.status(500).json({ 
            message: 'Failed to place order', 
            error: error.message 
        });
    }
};


const fetchCategory = async( req , res) =>{

  try {    
     const category = await Category.find({})
     res.status(200).json(category)
  } catch (error) {
    res.status(500).json({message: 'server error'})
  }
 
}




const orderProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { orderItems, shippingAddress, paymentMethod } = req.body; 
       

        if(shippingAddress === undefined || paymentMethod === undefined || orderItems.length === 0) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        const newOrder = {
            items: orderItems,
            totalAmount: orderItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0),
            shippingAddress,
            paymentMethod,
            status : 'pending',
            stage : [{title: "Ordered At" , description : "We have recieved your order" , Date : Date.now()}] ,
            orderedAt: new Date().toISOString()
        };

        user.orders.push(newOrder);
        user.cart = []
        await user.save();

        res.status(201).json({ order: newOrder });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};






const fetchOrderForReview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.params.orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    const orders = await user.orders.find(order => order?._id.toString() === req.params.orderId);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    } 
    res.json({ message: 'Orders fetched successfully', orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }

}



const fetchOrderStage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.params.orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    const orders = await user.orders.filter(order => order?._id.toString() === req.params.orderId).select('status');
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    } 
    res.json({ message: 'Orders fetched successfully', orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }

}

ProductRoute.route('/').get(productData)
ProductRoute.route('/addquantity').post(addQuantity) 
ProductRoute.route('/fetchorder/:orderId').get(protect, fetchOrderForReview)
ProductRoute.route('/order').post(protect, orderProducts)
ProductRoute.route('/decreasequantity').post(decreaseQuantity)
ProductRoute.route('/single/:id').get(fetchSingleProduct)
ProductRoute.route('/order').post(orderProduct);
ProductRoute.route('/catagory').get(fetchCategory); 
ProductRoute.route('/orderCartProducts').post(orderCartProducts);
ProductRoute.route('/fetchOrder').get(protect ,fetchOrder); 
ProductRoute.route('/cart').post(fetchCartProduct)
ProductRoute.route('/addtocart').post(addToCart) 
ProductRoute.route('/addtofavorite').post(addToFavorite)
ProductRoute.route('/favorite/:id').get(fetchFavoriteProduct) 
ProductRoute.route('/deletecart/:productId').delete(protect , deleteFromCart) 
ProductRoute.route('/addQuantity').delete(deleteFromCart) 
ProductRoute.route('/deletefavorite/:productId').delete(protect , deleteFromFavorite)  



export default ProductRoute;