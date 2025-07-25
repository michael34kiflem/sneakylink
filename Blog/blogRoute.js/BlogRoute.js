import express from 'express'
import Blog from '../blogModel/blogModel.js'

const blogRoute = express.Router()





const fetchBlog = async(req , res)=>{
    try {
        const blog = await Blog.find({})
        res.json(blog)
    } catch (error) {
        res.status(500).json({message : error.message})
    }
}



blogRoute.route('/').get(fetchBlog)

export default blogRoute;