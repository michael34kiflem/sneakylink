import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../user/userModel/userModel.js";
import mongoose from 'mongoose';
import { Router } from "express";



const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET); 
       req.user = await User.findById(decoded.id); 

      if (!req.user) {
        res.status(404);
        throw new Error("User not found");
      }

      next(); 
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
});


const admin = (req, res, next) => {
  if (req.user?.admin) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
}
export { protect , admin};
