import Notification from "../notificationModel/notificationModel.js";
import express from "express";
import { Expo } from 'expo-server-sdk';
const router = express.Router();

const expo = new Expo();

const notificationRouter = express.Router();

const storeToken = async (req, res) => {
  try {
    const { userId, expoPushToken } = req.body;

    // Validate inputs
    if (!userId || !expoPushToken) {
      console.error('[storeToken] Missing userId or expoPushToken:', { userId, expoPushToken });
      return res.status(400).json({ 
        error: 'Both userId and expoPushToken are required' 
      });
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error('[storeToken] Invalid Expo push token format:', expoPushToken);
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

    let result;
    try {
      result = await Notification.findOneAndUpdate(
        { userId }, // Find by userId
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
    } catch (dbError) {
      console.error('[storeToken] Database error:', dbError);
      return res.status(500).json({
        error: 'Database error',
        details: dbError.message
      });
    }

    // Determine if this was an insert or update
    const action = result.createdAt?.getTime() === result.updatedAt?.getTime() 
      ? 'created' 
      : 'updated';

    return res.status(200).json({ 
      message: `Token ${action} successfully`,
      result 
    });

  } catch (error) {
    console.error('[storeToken] Unexpected error:', error);
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

    // Validate inputs
    if (!userId || !title || !body) {
      return res.status(400).json({ 
        error: 'userId, title and body are required' 
      });
    }

    // Get user's token from DB
    const tokenDoc = await Notification.findOne({ userId });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'User token not found' });
    }

    // Validate the token
    if (!Expo.isExpoPushToken(tokenDoc.expoPushToken)) {
      return res.status(400).json({ 
        error: 'Invalid Expo push token stored for this user' 
      });
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
    const receipts = await expo.sendPushNotificationsAsync([message]);
    
    // Check for errors in receipts
    if (receipts[0]?.status === 'error') {
      return res.status(400).json({ 
        error: 'Failed to send notification',
        details: receipts[0].message 
      });
    }

    return res.status(200).json({ 
      message: 'Notification sent successfully',
      receipts 
    });

  } catch (error) {
    console.error('Error in sendToUser:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Send Notification to All Users
const sendToAll = async (req, res) => {
  try {
    const { title, body, data = {} } = req.body;

    // Validate inputs
    if (!title || !body) {
      return res.status(400).json({ 
        error: 'title and body are required' 
      });
    }

    const tokens = await Notification.find({});
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No tokens found' });
    }

    // Filter valid tokens
    const validTokens = tokens.filter(token => 
      Expo.isExpoPushToken(token.expoPushToken)
    );

    if (validTokens.length === 0) {
      return res.status(400).json({ 
        error: 'No valid push tokens found' 
      });
    }

    // Prepare messages
    const messages = validTokens.map(token => ({
      to: token.expoPushToken,
      sound: 'default',
      title,
      body,
      data
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const receipts = [];


    for (const chunk of chunks) {
      try {
        const receipt = await expo.sendPushNotificationsAsync(chunk);
        receipts.push(...receipt);
      } catch (error) {
        console.error('Error sending chunk:', error);
        // Continue with next chunks even if one fails
      }
    }


    const failedNotifications = receipts.filter(
      receipt => receipt?.status === 'error'
    );

    if (failedNotifications.length > 0) {
      console.error('Some notifications failed:', failedNotifications);
    }

    return res.status(200).json({ 
      message: `Notifications sent (${receipts.length - failedNotifications.length} successful, ${failedNotifications.length} failed)`,
      totalSent: receipts.length,
      failed: failedNotifications.length,
      receipts 
    });

  } catch (error) {
    console.error('Error in sendToAll:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}


notificationRouter.route('/save-token').post(storeToken);
notificationRouter.route('/send-to-user').post(sendToUser);
notificationRouter.route('/send-to-all').post(sendToAll);

export default notificationRouter;