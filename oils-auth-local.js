var passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');

module.exports = function(pluginConf, web, next) {
  var self = this;

  pluginConf = web.utils.extend({
                                "loginView": "/node_modules/oils-plugin-auth/views/login.html",
                                "registerView": "/node_modules/oils-plugin-auth/views/register.html",
                                "userModel": "/node_modules/oils-plugin-auth/web/src/models/User.js"
                                },
                                pluginConf);
  
  

  web.on('beforeRender', function(view, options, callback, req, res) {
    options._user = req.user;
  })  

  web.on('initServer', function() {
  var User = web.includeModel(pkg.oils.userModel);

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
            //console.log('Password123:', isMatch); // -&gt; Password123: true
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

  });

  web.applyRoutes({
    '/logout': function(req, res){
      req.logout();
      res.redirect('/');
    },
    
    /*'/login-success': function(req,res) {
      res.redirect(pkg.oils.redirectAfterLogin);
    },*/

    '/login': web.include('/node_modules/oils-plugin-auth/controllers/login.js'),

    '/register': web.include(web.eitherPath('/node_modules/oils-plugin-auth/web/src/controllers/register.js', '.web/src/controllers/register.js'))
  });

  next();


}

