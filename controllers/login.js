var passport = require('passport');
module.exports = function(pkg, app) {
 
  return {

    get: function(req, res) {
      var r = req.query.r || '';
      var username = req.query.username || '';
      res.renderFile(pkg.oils.loginView, {r: r, username: username});
    },
    post: function(req,res) {

      var redirectAfterLogin = req.body.r || pkg.oils.redirectAfterLogin;

      passport.authenticate('local', { 
        //successRedirect: '/login-success' + param,
        successRedirect: redirectAfterLogin,
        failureRedirect: '/login?username=' + encodeURIComponent(req.body.username),
        failureFlash: true 
      })(req,res);
    }
  }


}