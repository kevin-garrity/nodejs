var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var applicationSchema = new mongoose.Schema({

  athlete: { type: String },
  coach: { type: String },
  models: {
  	athlete: { type : Array, default: [] },
  	coach: { type : Array, default: [] }
  },
  status: { type: String, default: 'pending' },
  athleteRead: { type: Boolean, default: false },
  coachRead: { type: Boolean, default: false },
  uniqueString: { type: String, unique: true },
  body: String,
  requirements: String

});


module.exports = mongoose.model('Application', applicationSchema);
