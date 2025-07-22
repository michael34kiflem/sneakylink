import dotenv from 'dotenv';
dotenv.config(); 
import mongoose from 'mongoose';
export const connectToDatabase = async () => {
console.log(process.env.MONGO_URL)
  try {
    mongoose.set('strictQuery', false);
    const connect = await mongoose.connect(process.env.MONGO_URL , {
      serverSelectionTimeoutMS: 30000,
    });
    console.log(`MongoDB Connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};
