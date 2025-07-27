import mongoose from 'mongoose'

const Notification = new mongoose.Schema({
title : {type : String , required : true} ,
message: { type: String, required: true },
read: { type: Boolean, default: false },
link: { type: String }, // Optional link for navigation
createdAt: { type: Date, default: Date.now } ,
type: {type : String} ,

})
const blogSchema = new mongoose.Schema({
  userId : {type : String} ,
  notifications : [Notification] ,
  unreadCount : {type : Number}
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;