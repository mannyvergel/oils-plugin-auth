var passport = require('passport');

var pluginConf = web.plugins['oils-plugin-auth'].conf;

module.exports = {

    get: function(req, res) {
      var r = req.query.r || '';
      var username = req.query.username || '';
      res.renderFile(pluginConf.loginView, {r: r, username: username});
    },
    post: function(req,res) {

      var redirectAfterLogin = req.body.r || pluginConf.redirectAfterLogin;
      passport.authenticate('local', function(err, user, info) {
        if (err) { throw err; }
        if (!user) { 
          req.flash('error', 'Invalid username or password.')
          return res.redirect('/login?username=' + encodeURIComponent(req.body.username)); }
        req.logIn(user, function(err) {
          if (err) { throw err; }
          return res.redirect(redirectAfterLogin);
        });
      })(req, res);

      
      /*passport.authenticate('local', { 
        //successRedirect: '/login-success' + param,
        successRedirect: redirectAfterLogin,
        failureRedirect: '/login?username=' + encodeURIComponent(req.body.username),
        failureFlash: true 
      })(req,res, function() {
        
      });*/


    }
  }


