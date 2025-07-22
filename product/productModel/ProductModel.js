// models/Product.js or models/Product.ts (if using TypeScript)
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // Array of image URLs

    },
    subtitle: {
      type: String,

    },
    description: {
      type: String,
    },
    sizes: {
      type: [String], // Example: ["S", "M", "L", "XL"]
    },
    colors: {
      type: [String],
    },
    brand: {
      type: String,
    },
    category: {
      type: String,
    },
    price: {
      type: Number,

    },
    rating: {
      type: Number,
      default: 0,
    },
    productIsNew: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: true,
    },
 
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;