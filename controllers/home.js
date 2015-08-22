var User = require('../models/User');
var Message = require('../models/Message');
var Application = require('../models/Application');

/**
 * GET /
 * Home page.
 */

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

exports.index = function(req, res) {
if (!req.user){
  res.render('home', {
    title: 'Home'
  });
} else {

  var allCoaches = new Array();
  var appliedCoaches = new Array();
  var appliedCoaches_polish = new Array();

  Application.find({athlete: req.user.customid}, function(err, applications){
    console.log("Trying..."+applications.length);
    if(applications.length > 0){
      for(var key in applications){
        appliedCoaches.push(applications[key].coach);
      }
    }

    // console.log("Applied coaches are..."+appliedCoaches);
    User.find(function(err, users) {
      for(var key in users){
        if(users[key].role == 'Coach'){
          console.log(users[key].customid);
          if(!appliedCoaches.includes(users[key].customid)){
            allCoaches.push(users[key]);
          } else {
            appliedCoaches_polish.push(users[key]);
          }
        }
      }

      var messageCount = 0;

      Application.find({ $or: [ {coach: req.user.customid, status: 'pending', coachRead: false }, {athlete: req.user.customid, status: { $ne: 'pending' }, athleteRead: false } ]}, function(err, applications) {
        applicationsCount = applications.length; 
        res.render('dashboard', {
          title: 'Dashboard',
          coaches: allCoaches,
          xcoaches: appliedCoaches_polish,
          unread: applicationsCount
        });
      });

    });
  })



}
};