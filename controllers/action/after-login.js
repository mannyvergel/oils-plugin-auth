'use strict';

module.exports = {
	all: function(req, res) {
    const userRole = req.user && req.user.role;
		if (userRole === 'ADMIN') {
			res.redirect('/admin');
		} else if (userRole === 'USER') {
			res.redirect('/');
		} else {
			res.redirect('/');
		}
	}
}