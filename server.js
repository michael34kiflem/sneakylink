import express from 'express'
import { connectToDatabase } from './DatabaseConnection/connectToDatabase.js'
import ProductRoute from './product/productRoute/ProductRoute.js'
import cors from 'cors';
import categoryRoute from './category/categoryRoute/categoryRoute.js';
import userRoute from './user/userRoute/UserRoute.js';
import notificationRouter from './notification/notificationRoute/notificationRoute.js';
import blogRoute from './Blog/blogRoute.js/BlogRoute.js';

const app = express ()


app.use(cors())
app.use(express.json())

app.use('/product' , ProductRoute)
app.use('/category' , categoryRoute)
app.use('/user' , userRoute)
app.use('/notification' , notificationRouter) 
app.use('/blog' , blogRoute) 

connectToDatabase()

app.listen(process.env.PORT , ()=>{
    console.log('server is connected ')
})