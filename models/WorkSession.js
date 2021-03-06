var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var workSessionSchema = new mongoose.Schema({

  athlete: { type: String },
  coach: { type: String },
  sessionType: String,
  uniqueString: { type: String, unique: true },
  stage: { type: String, default: 'feedback' },
  athleteRead: { type: Boolean, default: false },
  coachRead: { type: Boolean, default: false },
  videos: { type: Array, default: [] },
  documents: { type: Array, default: [] },
  models: {
    athlete: { type : Array, default: [] },
    coach: { type : Array, default: [] }
  },
  name: {
  	athlete: String,
  	coach: String
  }

});


module.exports = mongoose.model('WorkSession', workSessionSchema);
