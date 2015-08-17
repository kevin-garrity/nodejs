var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var Message = require('../models/Message');
var Application = require('../models/Application');
var WorkSession = require('../models/WorkSession');
var secrets = require('../config/secrets');
var stripe = require('stripe')(secrets.stripe.secretKey);

/**
 * GET /apply
 * Apply for a coach
 */

 
exports.Apply = function(req, res) {

  if(req.user.role == 'Player'){

    User.findOne({ customid : req.params.customid }, function(err, coach){
      if(!err){

        console.log("Logging application with coach..."+req.params.customid);
        var application = new Application({
          athlete: req.user.customid,
          coach: req.params.customid,
          name: {
            athlete: req.user.profile.name,
            coach: coach.profile.name
          },
          uniqueString: req.params.customid+req.user.customid,
          body: 'Hey coach -- you gotta give me a shot!'
        });

        application.save(function(err) {
          if (err){
            req.flash('errors', { msg: 'Sorry, you have already applied.' });
            res.redirect('/');
          } else {
            Application.find(function(err, messages) {
              req.flash('success', { msg: 'Your application has been sent -- good luck!' });
              res.redirect('/');
            });
          }
        });   

        }
      });

          } else {
        req.flash('errors', { msg: 'Sorry, coaches cannot apply.' });
        res.redirect('/');
      }
};

exports.ApplicationResponse = function(req, res){

  if(req.params.msgID && req.params.accepted){
    Message.findById(req.params.msgID, function(err, message){
      var isAccepted, messageBody;
      if(req.params.accepted){
        isAccepted = "accept";
        messageBody = "You have been accepted. Click here to pay.";
      } else {
        isAccepted = "reject";
        messageBody = "Sorry, your application was rejected.";
      }
      var message = new Message({
        recipient: message.sender,
        sender: message.recipient,
        messageType: 'apply',
        status: isAccepted,
        body: messageBody
      });
    });
  }

}

exports.ProcessPayment = function(req, res){

  Application.findOneAndRemove({ uniqueString: req.body.appid }, function(err, application){
    if(!err){
      if(application.athlete = req.user.customid){
        var stripeToken = req.body.stripeToken;
        var stripeEmail = req.body.stripeEmail;
        stripe.charges.create({
          amount: 6000,
          currency: 'usd',
          card: stripeToken,
          description: stripeEmail
        }, function(err, charge) {
          if (err && err.type === 'StripeCardError') {
            req.flash('errors', { msg: 'Your card has been declined.' });
            res.redirect('/applications');
          }

          var session = new WorkSession({
            athlete: req.user.customid,
            coach: application.coach,
            name: {
              athlete: req.user.profile.name,
              coach: application.name.coach
            },
            uniqueString: application.uniqueString
          });

          session.save(function(err){
            if(err){
              req.flash('errors', { msg: 'Sorry, you already have an existing session with them.' });
              res.redirect('/applications');
            } else {

              var message = new Message({
                sessionId: application.uniqueString,
                messageType: 'vrequest',
                name: {
                  athlete: req.user.profile.name,
                  coach: application.name.coach
                },
                body: application.requirements
              })

              message.save(function(err){
                req.flash('success', { msg: 'Your card has been charged successfully. The session has started.' });
                console.log(session);
                res.redirect('/sessions');
              });

            }
          });
        });  
      }
    } else {
      req.flash('errors', { msg: 'Something broke. :(' });
      res.redirect('/applications');
    }
  });

}

exports.Applications = function(req, res){

  var pending, accepted, rejected;  

  if(req.user.role == 'Coach'){

    Application.update({ coach: req.user.customid, status :'pending', read: false }, { read: true }, {multi: true}, function(err, num){
      
      Application.find({ coach: req.user.customid }, function(err, applications) {
        pending = applications.filter(function(el){
          return el.status == 'pending';
        });
        accepted = applications.filter(function(el){
          return el.status == 'accepted';
        });
        rejected = applications.filter(function(el){
          return el.status == 'rejected';
        });
        res.render('applications', {
          title: 'Applications',
          pending: pending,
          accepted: accepted,
          rejected: rejected
        });
      }); 

    }); 
  } else {
    Application.update({ athlete: req.user.customid, status : { $ne: 'pending' }, read: false }, { read: true }, {multi: true}, function(err, num){
      
      Application.find({ athlete: req.user.customid }, function(err, applications) {
        pending = applications.filter(function(el){
          return el.status == 'pending';
        });
        accepted = applications.filter(function(el){
          return el.status == 'accepted';
        });
        rejected = applications.filter(function(el){
          return el.status == 'rejected';
        });
        res.render('applications', {
          title: 'Applications',
          pending: pending,
          accepted: accepted,
          rejected: rejected,
          publishableKey: secrets.stripe.publishableKey
        });
      }); 

    }); 
  }

}


exports.Decision = function(req,res){

  console.log("Decision");
  if(req.user.role == 'Coach'){

    console.log("Making a decision..."+req.body.applicationid);
    Application.findOne({ uniqueString: req.body.applicationid }, function(err, application){

      if(err) console.log("Failed");
      if ( req.user.customid == application.coach ){
        application.status = req.params.application_decision;
        application.requirements = req.body.requirements;
        application.read = false;
        application.save(function(err){
          console.log("Saving...");
          if(err){
            req.flash('error', { msg: err });
            res.redirect('/');
          } else {
            console.log("Saved!");
            req.flash('success', { msg: 'Applicant has been '+req.params.application_decision+'.' });
            res.redirect('/');
          }

        });
      }

    });

  }

}