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

exports.allSessions = function(req, res) {

	console.log("Hello")
	WorkSession.find({ $or: [ { coach: req.user.customid }, { athlete: req.user.customid } ]}, function(err, workSession){
		if(err) console.log(err);

        res.render('sessionsview', {
          title: 'Sessions',
          sessions: workSession
        });
	})

}

exports.sendVideos = function(req, res){

	console.log("Made it!");
	if( req.body.sessionid ){

		console.log("Hello?");
		WorkSession.findOne({ uniqueString: req.body.sessionid }, function(err, worksession){

			if(err){
				req.flash('errors', { msg: 'Video save error.' });
				res.redirect('/sessions');
			} else {
				if(worksession.athlete = req.user.customid ){
					var messageBody = "";
					for(x=0; x < req.body.videos.length; x++){
						worksession.videos.push(req.body.videos[x]);
						messageBody+= "<iframe width='30%' frameborder='0' height='200' src='" + req.body.videos[x] + "'></iframe>";
					}
					worksession.stage = "report";
					worksession.save(function(err){
						if(err){
							req.flash('errors', { msg: 'Error saving video.' });
							res.redirect('/sessions');
						} else {

							var message = new Message({
								sessionId: worksession.uniqueString,
								messageType: 'videos',
								name: {
								  athlete: req.user.profile.name,
								  coach: worksession.name.coach
								},
								body: req.body.videos
							});

							message.save(function(err){
								if(err){
									req.flash('errors', { msg: 'Error saving video.' });
									res.redirect('/sessions/'+worksession.uniqueString);
								} else {

									var newMessage = new Message({
										sessionId: worksession.uniqueString,
										messageType: 'rrequest',
										name: {
										  athlete: req.user.profile.name,
										  coach: worksession.name.coach
										}
									});

									newMessage.save(function(err){
										if(err){
											req.flash('errors', { msg: 'Error saving video.' });
											res.redirect('/sessions/'+worksession.uniqueString);
										} else {
											req.flash('success', { msg: 'Videos succesfully saved!' });
											res.redirect('/sessions/'+worksession.uniqueString);
										}
									});
								}
							})
						}
					});
				} else {
					req.flash('errors', { msg: 'You do not have permission to do that.' });
					res.redirect('/sessions');
				}
			}

		})

	}

}

exports.sendDocuments = function(req, res){

	console.log("Made it!");
	if( req.body.sessionid ){

		console.log("Hello?");
		WorkSession.findOne({ uniqueString: req.body.sessionid }, function(err, worksession){

			if(err){
				req.flash('errors', { msg: 'Document save error.' });
				res.redirect('/sessions');
			} else {
				if(worksession.coach = req.user.customid ){
					for(x=0; x < req.body.documents.length; x++){
						req.body.documents[x] = "https://s3-us-west-2.amazonaws.com/projectpatterson/" + worksession.uniqueString + req.body.documents[x];
					}
					worksession.stage = "closed";
					worksession.save(function(err){
						if(err){
							req.flash('errors', { msg: 'Error saving documents.' });
							res.redirect('/sessions');
						} else {

							var message = new Message({
								sessionId: worksession.uniqueString,
								messageType: 'report',
								name: {
								  athlete: req.user.profile.name,
								  coach: worksession.name.coach
								},
								body: req.body.documents
							});

							message.save(function(err){
								if(err){
									req.flash('errors', { msg: 'Error saving document.' });
									res.redirect('/sessions/'+worksession.uniqueString);
								} else {

									var newMessage = new Message({
										sessionId: worksession.uniqueString,
										messageType: 'closed',
										name: {
										  athlete: req.user.profile.name,
										  coach: worksession.name.coach
										}
									});

									newMessage.save(function(err){
										if(err){
											req.flash('errors', { msg: 'Error saving documents.' });
											res.redirect('/sessions/'+worksession.uniqueString);
										} else {
											req.flash('success', { msg: 'Documents succesfully saved!' });
											res.redirect('/sessions/'+worksession.uniqueString);
										}
									});
								}
							})
						}
					});
				} else {
					req.flash('errors', { msg: 'You do not have permission to do that.' });
					res.redirect('/sessions');
				}
			}

		})

	}

}
exports.viewSession = function(req, res){

	var sID =req.params.sessionid;

	WorkSession.findOne({ uniqueString: sID }, function(err, worksession){
		if(err || worksession == null){
			req.flash('errors', { msg: 'Invalid session selected.' });
			res.redirect('/sessions');
		} else {

			// console.log("I am..."+req.user.customid);
			// console.log("And the session is..."+JSON.stringify(worksession));
			if(req.user.customid == worksession.coach || req.user.customid == worksession.athlete){
				worksession.read = false;
				worksession.save(function(err){
					if(err){
						req.flash('errors', { msg: 'Session save error. Please contact us at hello@patterson.com' });
						res.redirect('/sessions');
					} else {
						Message.find({ sessionId: sID }, function(err, messages){
					        res.render('messageview', {
					          title: 'Messages',
					          messages: messages,
					          worksession: worksession
					        });
						});		
					}
				});
		
			} else {
				req.flash('errors', { msg: 'Invalid session selected.' });
				res.redirect('/sessions');
			}
		}
	});

}