module.exports = {
  get: function(req, res) {
    if (!req.user) {
      throw new Error("Not logged in.");
    }
    res.renderFile(web.auth.conf.userProfileView);
  },

  post: function(req, res) {
    if (!req.user) {
      throw new Error("Not logged in.");
    }
    let paramsCopy = Object.assign({}, req.body);

    delete paramsCopy._id;
    if (web.stringUtils.isEmpty(paramsCopy.password) && web.stringUtils.isEmpty(paramsCopy.confirmPassword)) {
      delete paramsCopy.password;
      delete paramsCopy.confirmPassword;
    }

    validateParams(req, paramsCopy, function(err, errMsgs) {
      if (err) {
        throw err;
      }

      if (errMsgs.length > 0) {
        for (let i in errMsgs) {
          req.flash('error', errMsgs[i]);
        }
        res.redirect('/user-profile');
        return;
      }

      var prevEmail = req.user.email;

      // update the username as well if it's the same as previous email
      if (req.user.username == req.user.email) {
        paramsCopy.username = paramsCopy.email;
      }

      req.user.set(paramsCopy);
      req.user.save(req, function(err) {
        if (err) {
          throw err;
        }

        if (prevEmail != req.user.email) {
          web.callEvent('auth.emailChange', [req.user, prevEmail]);  
        }

        req.flash('info', "Profile saved 2.");
        res.redirect('/user-profile');
      })
    });
  }
}

function validateParams(req, params, cb) {
  let errMsgs = [];

  if (params.password || params.confirmPassword) {
    if (params.password != params.confirmPassword) {
      errMsgs.push("Passwords do not match.");
    }

    if (params.password.length < web.auth.conf.passreqts.length) {
      errMsgs.push('Password should have a minimum of ' + web.auth.conf.passreqts.length + ' characters.');
    }

    req.user.comparePassword(params.oldPassword, function(err, isMatch) {
      if (err) throw err;

      if (!isMatch) {
        errMsgs.push("Old password is invalid.");
      }

      cb(null, errMsgs);
    });
    return;
  }


  cb(null, errMsgs);
}