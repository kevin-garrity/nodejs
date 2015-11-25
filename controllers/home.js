var User = require('../models/User');
var Message = require('../models/Message');
var Application = require('../models/Application');
var Beta = require('../models/Beta');
var nodemailer = require('nodemailer');
var secrets = require('../config/secrets');
var smtpTransport = require('nodemailer-smtp-transport');



exports.submitEmail = function(req, res, next) {


  function sendEmail(add, rname, msg, subj) {

    console.log("Called sendEmail");

    var from = 'simon@tryrookie.com';
    var name = rname;
    var body = msg;
    var to = add;
    var subject = subj;

    console.log(secrets.mandrill.user);

    var transporter = nodemailer.createTransport((smtpTransport({
      host: 'smtp.mandrillapp.com',
      secureConnection: false, // use SSL
      port: 587, // port for secure SMTP
      auth: {
        user: secrets.mandrill.user,
        pass: secrets.mandrill.password
      }
    })));

    console.log("MADE IT HERE");
    var mailOptions = {
      to: to,
      from: from,
      subject: subject,
      text: body
    };

    console.log("HELLLO");

    transporter.sendMail(mailOptions, function(err) {
      console.log(err);
      console.log("HELLO?");
      return;
    });
  };

  console.log("We are here");

  var beta = new Beta({
    email: req.body.emailsubmit,
    referrer: req.body.ref
  });

  beta.save(function(err) {
    if (err) return next(err);
    console.log("HI?");
    sendEmail(req.body.emailsubmit, req.body.emailsubmit, 'Hey there!\n\nThank you for signing up for Rookie; the only platform that allows athletes to work with the best skills coaches in the world.\n\nOver the next couple of months we will start inviting people like you to try Rookie. Getting an invite allows you to:\n1. Choose the best coaches on the platform\n2. Get more time with your coaches.\n3. Free pro-level skills assessment and personalized skills program\n\nYou are the 447th person to sign up. For every five of your friends that sign-up, we will move you up ten spots on our waiting list.\n\nAgain, thank you for signing up! Let me know if you have any questions.\nSimon', 'Congratulations on signing up!');
    res.redirect('/?betasubmitted');
  });

};



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