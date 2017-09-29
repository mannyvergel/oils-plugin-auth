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
    var paramsCopy = Object.assign({}, req.body);

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
        for (var i in errMsgs) {
          req.flash('error', errMsgs[i]);
        }
        res.redirect('/user-profile');
        return;
      }

      req.user.set(paramsCopy);
      req.user.save(req, function(err) {
        if (err) {
          throw err;
        }

        req.flash('info', "Profile saved.");
        res.redirect('/user-profile');
      })
    });
  }
}

function validateParams(req, params, cb) {
  var errMsgs = [];

  if (params.password || params.confirmPassword) {
    if (params.password != params.confirmPassword) {
      errMsgs.push("Passwords do not match.");
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