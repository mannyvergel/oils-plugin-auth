'use strict';

const passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;


module.exports = async function AuthLocal(pluginConf, web) {
  const mongoose = web.require('mongoose');
  let self = this;

  web.auth = self;

  let pluginPath = pluginConf.pluginPath;

  pluginConf = web.utils.extend({
      loginView: pluginPath + "/views/login.html",
      loginController: pluginPath + '/controllers/login.js',
      registerView: pluginPath + "/views/register.html",
      registerController: pluginPath + '/controllers/register.js',
      registerAdminView: pluginPath + "/views/register-admin.html",
      userProfileView: pluginPath + "/views/user-profile.html",
      userModel: pluginPath + "/models/User.js",
      redirectAfterLogin: "/action/after-login",

      defaultAdminUsername:'admin',

      registrationEnabled: true,
      needsInvitation: false,
      humanTest: true,
      saltRounds: 12,

      passreqts: {
        length: 6
      },

      checkIfNeededAdminRegistration: async function() {

        let User = web.auth.UserModel;
        let users = await User.find({}).limit(1).lean().exec();
       
        return (!users || users.length == 0);
      },

      labels: {
        username: "Email",
        password: "Password",
      },

      invitationContentHandler: function(user, doc) {
        user.role = doc.content || 'USER';
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
    if (req.user) {
      let userObj = req.user.toObject({getters: true});
      userObj.password = null;
      options._user = userObj;
    }
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

  let authRoutes = {
    '/logout': function(req, res){
      req.logout();
      res.redirect('/');
    },

    '/login': web.include(pluginConf.loginController),

    '/register': web.include(pluginConf.registerController),
    '/user-profile': web.include(pluginPath + '/controllers/user-profile.js'),
    '/action/after-login': web.include(pluginPath + '/controllers/action/after-login.js')
  };

  web.auth.shouldGenAdmin = await pluginConf.checkIfNeededAdminRegistration();
  
  if (web.auth.shouldGenAdmin) {
    authRoutes['/register-admin'] = web.include(pluginPath + '/controllers/register-admin.js');

    express.use(function(req, res, next) {
      if (web.auth.shouldGenAdmin && req.url == "/") {
        res.redirect('/register-admin');
      } else {
        next();
      }
    });
  }

  web.addRoutes(authRoutes);

  if (pluginConf.needsInvitation) {
    
    web.on('initServer', async function() {
      web.runOnce('AUTH_RUN_ONCE', async function() {

        let dmsUtils = web.cms.utils;
        let randomStr = await web.stringUtils.genSecureRandomString();
        await dmsUtils.createFileIfNotExist('/invites/sample-' + randomStr, "USER");

        console.log("Created sample invitation sample-" + randomStr);

      });
    })
    
  }


}


