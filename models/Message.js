var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({

  athlete: { type: String },
  coach: { type: String },
  messageType: String,
  status: { type: String, default: 'unread' },
  name: { 
  	athlete: String,
  	coach: String
  },
  sessionId: { type: String },
  body: String

});


module.exports = mongoose.model('Message', messageSchema);
