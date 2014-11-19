var passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');

module.exports = function AuthLocal(pluginConf, web, next) {
  var self = this;

  web.auth = self;


  var pluginPath = pluginConf.pluginPath;

  pluginConf = web.utils.extend({
    "loginView": pluginPath + "/views/login.html",
    "registerView": pluginPath + "/views/register.html",
    "userModel": pluginPath + "/models/User.js",
    "redirectAfterLogin": "/"
    },
    pluginConf);
  
  web.auth.conf = pluginConf;

  web.on('beforeRender', function(view, options, callback, req, res) {
    options._user = req.user;
  })  

  var User = web.includeModel(pluginConf.userModel);
  
  web.auth.UserModel = User;
  web.auth.loginUtils = require('./utils/loginUtils');

  passport.use(new LocalStrategy(
    function(username, password, done) {


      User.findOne({ username: username }, function(err, user) {

        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password.' });
        }

        user.comparePassword(password, function(err, isMatch) {
            if (err) throw err;

            if (isMatch) {
              return done(null, user);
              
            } else {
              return done(null, false, { message: 'Incorrect password or password.' });
            }
        });

        
      });
    }
    ));


    var express = web.app;


    passport.serializeUser(function(user, done2) {
      done2(null, user._id);

    });

    passport.deserializeUser(function(id, done2) {
      var o_id = mongoose.Types.ObjectId(id);
      User.findOne({_id:o_id}, function (err, user) {
        done2(err, user);
      });
    });

    express.use(passport.initialize());

    express.use(passport.session());

  web.applyRoutes({
    '/logout': function(req, res){
      req.logout();
      res.redirect('/');
    },

    '/login': web.include(pluginPath + '/controllers/login.js'),

    '/register': web.include(pluginPath + '/controllers/register.js')
  });

  next();


}


