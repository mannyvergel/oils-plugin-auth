const passport = require('passport');

const pluginConf = web.plugins['oils-plugin-auth'].conf;

module.exports = {

    get: function(req, res) {
      let r = req.query.r || '';
      let username = req.query.username || '';
      res.renderFile(pluginConf.loginView, {r: r, username: username, labels: pluginConf.labels});
    },


    post: function(req,res) {

      let redirectAfterLogin = req.body.r || pluginConf.redirectAfterLogin;
      passport.authenticate('local', function(err, user, info) {
        if (err) { throw err; }
        if (!user) { 
          console.warn(req.body.username, "attempted wrong login.");
          req.flash('error', 'Invalid username or password.');
          return res.redirect('/login?username=' + encodeURIComponent(req.body.username)); }
        req.logIn(user, function(err) {
          if (err) { throw err; }

          if (req.body.remember == "Y") {
            req.sessionOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
          } else {
            //this seems to work for cookie-session
            req.sessionOptions.maxAge = 0;
          }

          req.session.save();

          console.log(req.body.username, "logged in.");

          return res.redirect(redirectAfterLogin);
        });
      })(req, res);



    }
  }


