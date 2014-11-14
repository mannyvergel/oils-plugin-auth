var passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;

var mongoose = include('mongoose');

module.exports = function(web, next) {
  var self = this;

  app.on('beforeRender', function(view, options, callback, req, res) {
    options._user = req.user;
  })  

  app.on('initServer', function() {
  var User = includeModel(pkg.oils.userModel);

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


    var server = app.server;


    passport.serializeUser(function(user, done2) {
      done2(null, user._id);

    });

    passport.deserializeUser(function(id, done2) {
      var o_id = mongoose.Types.ObjectId(id);
      User.findOne({_id:o_id}, function (err, user) {
        done2(err, user);
      });
    });

    server.use(passport.initialize());

    server.use(passport.session());

  });

  web.applyRoutes({
    '/logout': function(req, res){
      req.logout();
      res.redirect('/');
    },
    
    /*'/login-success': function(req,res) {
      res.redirect(pkg.oils.redirectAfterLogin);
    },*/

    '/login': require('./controllers/login.js')(pkg, web),

    '/register': require('./controllers/register.js')(pkg, web)
  });

  next();


}

