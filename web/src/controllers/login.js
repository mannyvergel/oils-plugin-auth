var passport = require('passport');
module.exports = {

    get: function(req, res) {
      var r = req.query.r || '';
      var username = req.query.username || '';
      res.renderFile(web.eitherPath('/web/src/views/login.html', './web/src/views/login.html'), {r: r, username: username});
    },
    post: function(req,res) {

      var redirectAfterLogin = req.body.r || '/';

      passport.authenticate('local', { 
        //successRedirect: '/login-success' + param,
        successRedirect: redirectAfterLogin,
        failureRedirect: '/login?username=' + encodeURIComponent(req.body.username),
        failureFlash: true 
      })(req,res);
    }
  }


