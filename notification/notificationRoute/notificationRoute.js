import Notification from "../notificationModel/notificationModel.js";

import express  from "express";
import { Expo } from 'expo-server-sdk';
const router = express.Router();

const expo = new Expo();


const notificationRouter = express.Router()

const storeToken = async (req, res) => {
  try {
    const { userId, expoPushToken } = req.body;

    // Validate inputs
    if (!userId || !expoPushToken) {
      return res.status(400).json({ 
        error: 'Both userId and expoPushToken are required' 
      });
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      return res.status(400).json({ 
        error: 'Invalid Expo push token format' 
      });
    }

    // Prepare the full document
    const fullDocument = {
      userId,
      expoPushToken,
      updatedAt: new Date(),

    };

    // Try to upsert the document
    const result = await Notification.findOneAndUpdate(
      { expoPushToken }, // Find by token
      { 
        $set: fullDocument,
        $setOnInsert: { createdAt: new Date() } // Only set on insert
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true, // Return the modified document
        runValidators: true // Ensure validation runs
      }
    );

    // Determine if this was an insert or update
    const action = result.createdAt?.getTime() === result.updatedAt?.getTime() 
      ? 'created' 
      : 'updated';

   

  } catch (error) {
    console.error('Error in storeToken:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};


// Send Notification to Single User
const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    // Get user's token from DB
    const tokenDoc = await Notification.findOne({ userId });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'User token not found' });
    }

    // Create message
    const message = {
      to: tokenDoc.expoPushToken,
      sound: 'default',
      title,
      body,
      data
    };

    // Send notification
    const receipt = await expo.sendPushNotificationsAsync([message]);
    res.status(200).json({ receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


const sendToAll = async (req, res) => {
  try {
    const { title, body, data = {} } = req.body;


    const tokens = await Notification.find({});
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No tokens found' });
    }

    // Prepare messages
    const messages = tokens.map(token => ({
      to: token.expoPushToken,
      sound: 'default',
      title,
      body,
      data
    }));

    // Split into chunks (Expo limit: 100 messages per request)
    const chunks = expo.chunkPushNotifications(messages);
    const receipts = [];

    // Send all chunks
    for (const chunk of chunks) {
      const receipt = await expo.sendPushNotificationsAsync(chunk);
      receipts.push(receipt);
    }

    res.status(200).json({ receipts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


notificationRouter.route('/save-token').post(storeToken)
notificationRouter.route('send-to-user').post(sendToUser)
notificationRouter.route('/send-to-all').post(sendToAll)

export default notificationRouter