var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var applicationSchema = new mongoose.Schema({

  athlete: { type: String },
  coach: { type: String },
  name: {
  	athlete: { type : String },
  	coach: { type : String }
  },
  status: { type: String, default: 'pending' },
  read: { type: Boolean, default: false },
  uniqueString: { type: String, unique: true },
  body: String,
  requirements: String

});


module.exports = mongoose.model('Application', applicationSchema);
