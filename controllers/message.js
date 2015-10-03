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

    User.findOne({ customid : req.body.coachid }, function(err, coach){
      if(!err){

        console.log("Logging application with coach..."+req.body.coachid);
        var application = new Application({
          athlete: req.user.customid,
          coach: req.body.coachid,
          models: {
            athlete: req.user,
            coach: coach
          },
          uniqueString: req.body.coachid+req.user.customid,
          body: req.body.skills
        });

        application.save(function(err) {
          if (err){
            console.log(err);
          } else {
            console.log("HI");
            return res.send("Hallo");
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


          var session = new WorkSession({
            athlete: req.user.customid,
            coach: application.coach,
            name: {
              athlete: req.user.profile.name,
              coach: application.models.coach[0].profile.name
            },
            models: {
              athlete: req.user,
              coach: application.models.coach[0]
            },
            uniqueString: application.uniqueString
          });

          session.save(function(err){
            if(err){
              req.flash('errors', { msg: 'Sorry, you already have an existing session with them.' });
              res.redirect('/applications');
            } else {

              var stripeToken = req.body.stripeToken;
              var stripeEmail = req.body.stripeEmail;
              stripe.charges.create({
                amount: 6000,
                currency: 'usd',
                card: stripeToken,
                description: stripeEmail
              }, function(err, charge) {
                if (err && err.type === 'StripeCardError') {
                  session.remove();
                  req.flash('errors', { msg: 'Your card has been declined.' });
                  res.redirect('/applications');
                } else {
                  var message = new Message({
                    sessionId: application.uniqueString,
                    messageType: 'provideFeedback',
                    name: {
                      athlete: req.user.profile.name,
                      coach: application.models.coach[0].profile.name
                    },              
                    body: application.requirements
                  })

                  message.save(function(err){
                    req.flash('success', { msg: 'Your card has been charged successfully. The session has started.' });
                    console.log(session);
                    res.redirect('/sessions/'+application.uniqueString);
                  });
                }    
              });         

            }
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

    Application.update({ coach: req.user.customid, status :'pending', coachRead: false }, { coachRead: true }, {multi: true}, function(err, num){
      
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
    Application.update({ athlete: req.user.customid, status : { $ne: 'pending' }, athleteRead: false }, { athleteRead: true }, {multi: true}, function(err, num){
      
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
        application.athleteRead = false;
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