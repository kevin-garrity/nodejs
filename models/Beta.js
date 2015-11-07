var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var betaSchema = new mongoose.Schema({

  email: { type: String },
  referrer: { type: String }

});


module.exports = mongoose.model('Beta', betaSchema);
