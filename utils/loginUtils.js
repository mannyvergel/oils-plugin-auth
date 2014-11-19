exports.handleLogin = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  req.flash('error', 'Login required.');
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

exports.handleRole = function(role, req, res, next) {
  var isLoggedIn = req.isAuthenticated();
  if (isLoggedIn && req.user.role == role) { return next(); }

  var message;

  if (isLoggedIn) {
  	message = 'You have no access to this page.';
  } else {
  	message = 'Please login to access this page.';
  }

  req.flash('error', message);
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

exports.handleAdmin = function(req, res, next) {
  if (exports.isAdmin(req)) { return next(); }

  req.flash('error', 'Administrator role is required to access this function.');
  res.redirect('/login?r=' + encodeURIComponent(req.url));
}

exports.isAdmin = function(req) {
  return req.isAuthenticated() && req.user.role == 'ADMIN';
}