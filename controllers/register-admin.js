
const passport = require('passport');

const pluginConf = web.plugins['oils-plugin-auth'].conf;
const User = web.includeModel(pluginConf.userModel);

module.exports = {

    get: function(req, res) {
      if (!web.auth.shouldGenAdmin) {
        throw new Error("Admin registration not allowed.");
      }
      
      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }
      
      res.renderFile(pluginConf.registerAdminView, {defaultAdminUsername: pluginConf.defaultAdminUsername});
    },

    post: function(req,res) {
      if (!web.auth.shouldGenAdmin) {
        throw new Error("Admin registration not allowed.");
      }
      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }

      let user = new User();
      
      let params = Object.assign({}, req.body);

      params._id = undefined;
      params.username = pluginConf.defaultAdminUsername;
      params.role = 'ADMIN';

      user.set(params);
     

      let errorMsgs = [];

      if (req.body.password != req.body.confirmPassword) {
        errorMsgs.push('Passwords do not match.');
      }


     
      if (errorMsgs.length > 0) {
        for (let i in errorMsgs) {
          req.flash('error', errorMsgs[i]);
        }
        
        res.renderFile(pluginConf.registerAdminView, {user: user, defaultAdminUsername: pluginConf.defaultAdminUsername});
        return;
      } 

      
     if (!user.username) {
        user.username = user.email;
      }

      if (!user.nickname) {
        user.nickname = user.fullname.split(' ')[0];
      }

      user.save(function(err) {

        if (err) {
          console.log('Error saving: ' + err);
          for (let i in err.errors) {
            req.flash('error', err.errors[i].message);
          }
          res.renderFile(pluginConf.registerAdminView, {user: user, defaultAdminUsername: pluginConf.defaultAdminUsername});
        } else {

          web.auth.shouldGenAdmin = false;

          req.login(user, function(err) {
            if (err) { throw err; }

            req.flash('info', 'Successfully registered and authenticated.');
            
            return res.redirect(pluginConf.redirectAfterLogin);
          });
        }
      })
      
    }
  }
