module.exports = {
	all: function(req, res) {
		if (req.user.role == 'ADMIN') {
			res.redirect('/admin');
		} else if (req.user.role == 'USER') {
			res.redirect('/');
		} else {
			res.redirect('/');
		}
	}
}