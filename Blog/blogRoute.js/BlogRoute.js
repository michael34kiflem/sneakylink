import express from 'express'
import Blog from '../blogModel/blogModel.js'
import { protect } from '../../authMiddleware/protectRoute.js'

const blogRoute = express.Router()





const fetchBlog = async(req , res)=>{
    try {  

        const userId = req.user.id
        const blog = await Blog.findOne({userId})
        blog.unreadCount = await blog.notifications.filter(item=>item.read === false).length
        res.json(blog)
    } catch (error) {
        res.status(500).json({message : error.message})
    }
}


const MarkAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const blog = await Blog.findOne({ userId });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Properly update all notifications
        blog.notifications = await  blog?.notifications?.map(notification => ({
            ...notification,
            read: true, // Mark all as read
        }));

        blog.unreadCount = 0; // Reset unread count

        await blog.save();
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



blogRoute.route('/').get(protect , fetchBlog)
blogRoute.route('/read').put(protect , MarkAllAsRead)


export default blogRoute;