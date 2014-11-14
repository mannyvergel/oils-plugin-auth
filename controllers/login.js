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

      passport.authenticate('local', { 
        //successRedirect: '/login-success' + param,
        successRedirect: redirectAfterLogin,
        failureRedirect: '/login?username=' + encodeURIComponent(req.body.username),
        failureFlash: true 
      })(req,res);
    }
  }


