exports.handleLogin = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  req.flash('error', 'Login required.');
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

exports.handleRole = function(role, req, res, next) {
  let isLoggedIn = req.isAuthenticated();

  if (!(role instanceof Array)) {
    role = [role];
  }

  if (isLoggedIn && hasRole(role, req.user.role)) { return next(); }

  let message;

  if (isLoggedIn) {
    message = 'You have no access to this page.';
  } else {
    message = 'Please login to access this page.';
  }

  req.flash('error', message);
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

function hasRole(roles, role) {
  for (let i in roles) {
    if (roles[i] == role) {
      return true;
    }
  }

  return false;
}

exports.handleAdmin = function(req, res, next) {
  if (exports.isAdmin(req)) { return next(); }

  req.flash('error', 'Administrator role is required to access this function.');
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

exports.isAdmin = function(req) {
  return req.isAuthenticated() && req.user.role == 'ADMIN';
}