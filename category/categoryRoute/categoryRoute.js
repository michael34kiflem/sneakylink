import express from "express";
import Category from "../categoryModel/Category.js";


const categoryRoute = express.Router()


const fetchCategory = async(req , res) =>{
    try { 
       const category = await Category.find({}) 

        res.json({message : 'success' , category})
    } catch (error) {
        res.status(500).json({
            message : 'The server failed to fetch the category'
        })
    }
}



categoryRoute.route('/').get(fetchCategory)



export default categoryRoute;