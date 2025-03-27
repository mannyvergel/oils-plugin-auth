'use strict';

const passport = require('passport');

const pluginConf = web.plugins['oils-plugin-auth'].conf;

module.exports = {

    get: async function(req, res) {
      let r = req.query.r || '';
      let username = req.query.username || '';
      res.renderFile(pluginConf.loginView, {r: r, username: username, labels: pluginConf.labels});
    },


    post: async function(req, res) {

      let redirectAfterLogin = req.body.r || pluginConf.redirectAfterLogin;
      let {user, info} = await authLocal(req, res); 

      if (!user) { 
        console.warn(req.body.username, "attempted wrong login. :::", web.utils.getClientIp(req), "::", req.headers['user-agent']);
        req.flash('error', info.message || 'Invalid username or password.');
        return res.redirect('/login?username=' + encodeURIComponent(req.body.username));
      }

      await reqLoginPromise(req, user);

      if (req.body.remember == "Y") {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
      } else {
        // timeout after browser closes
        // https://stackoverflow.com/questions/6992022/how-to-make-the-session-expire-after-a-browser-close-in-node-js-with-express
        req.session.cookie.expires = false;
      }

      req.session.save();

      console.log(req.body.username, "logged in.");

      res.redirect(redirectAfterLogin);

    }
  }

function authLocal(req, res) {

  return new Promise(function(resolve, reject) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        reject(err);
        return;
      }

      resolve({user, info});
    })(req, res);
  }) 
  
}

function reqLoginPromise(req, user) {
  return new Promise(function(resolve, reject) {
    req.logIn(user, function(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  })
}
