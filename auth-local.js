const passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;



module.exports = function AuthLocal(pluginConf, web, next) {
  const mongoose = web.require('mongoose');
  let self = this;

  web.auth = self;

  let pluginPath = pluginConf.pluginPath;

  pluginConf = web.utils.extend({
      loginView: pluginPath + "/views/login.html",
      registerView: pluginPath + "/views/register.html",
      userProfileView: pluginPath + "/views/user-profile.html",
      userModel: pluginPath + "/models/User.js",
      redirectAfterLogin: "/action/after-login",
      registrationEnabled: true,
      needsInvitation: false,
      humanTest: true,
      saltRounds: 12,

      labels: {
        username: "Email",
        password: "Password",
      },

      invitationContentHandler: function(user, doc) {
        user.role = doc.content;
      },
      deserializeUser: function(id, cb) { 
        User.findOne({_id:id}, function (err, user) {
          cb(err, user);
        });
      }
    },
    pluginConf);
  
  web.auth.conf = pluginConf;


  web.lib = web.lib || {};

  Object.defineProperty(web.lib, 'passport', {
    get: function() {
      let stack = new Error().stack;
      console.warn("Use web.auth.require('passport') instead of calling web.lib..", stack);
      return require('passport');
    }
  });


  //option to use auth's brcrypt and other libs
  web.auth.require = function(libStr) {
    return require(libStr);
  }

  web.on('beforeRender', function(view, options, callback, req, res) {
    options = options || {};
    options._user = req.user;
  })  

  let User = web.includeModel(pluginConf.userModel);
  
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
              return done(null, false, { message: 'Incorrect username or password.' });
            }
        });

        
      });

    })
  );


  let express = web.app;


  passport.serializeUser(function(user, cb) {
    cb(null, user._id);

  });

  passport.deserializeUser(pluginConf.deserializeUser);

  express.use(passport.initialize());

  express.use(passport.session());



  web.addRoutes({
    '/logout': function(req, res){
      req.logout();
      res.redirect('/');
    },

    '/login': web.include(pluginPath + '/controllers/login.js'),

    '/register': web.include(pluginPath + '/controllers/register.js'),
    '/user-profile': web.include(pluginPath + '/controllers/user-profile.js'),
    '/action/after-login': web.include(pluginPath + '/controllers/action/after-login.js')
  });

  next();


}


