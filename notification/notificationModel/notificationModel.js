import mongoose from 'mongoose'

const notificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true
  },
  expoPushToken: {
    type: String,
    required: true,
    unique: true // Prevent duplicate tokens
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationTokenSchema);
export default Notification;