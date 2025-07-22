import express from 'express'
import { connectToDatabase } from './DatabaseConnection/connectToDatabase.js'
import ProductRoute from './product/productRoute/ProductRoute.js'
import cors from 'cors';
import categoryRoute from './category/categoryRoute/categoryRoute.js';
import userRoute from './user/userRoute/UserRoute.js';
import notificationRouter from './notification/notificationRoute/notificationRoute.js';

const app = express ()


app.use(cors())
app.use(express.json())

app.use('/product' , ProductRoute)
app.use('/category' , categoryRoute)
app.use('/user' , userRoute)
app.use('/notification' , notificationRouter)
app.get('/' , (req , res)=>{
    res.json('hello you are logged in')
})

connectToDatabase()

app.listen(8000 , ()=>{
    console.log('server is connected on port 8000')
})