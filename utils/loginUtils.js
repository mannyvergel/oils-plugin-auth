exports.handleLogin = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  req.flash('error', 'Login required.');
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