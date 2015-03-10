
var passport = require('passport');

var questions = [
{q: 'Are you from mars?', a: 'no'},
{q: "What is 5 + 3?", a: '8'},
{q: "What is 7 x 3?", a: '21'},
{q: "Are you a bot?", a: 'no'},
{q: "What's the color of lemons?", a: 'yellow'},
{q: "What's the color of bananas?", a: 'yellow'},
{q: "Complete the sentence: Roses are red, violets are _____?", a: 'blue'},
{q: "What is 2 + 2?", a: '4'},
]

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var pluginConf = web.plugins['oils-plugin-auth'].conf;


var User = web.includeModel(pluginConf.userModel);
module.exports = {

    get: function(req, res) {

      var pluginConf = web.plugins['oils-plugin-auth'].conf;
      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }
      var qIndex = getRandomInt(0, questions.length-1);
      res.renderFile(pluginConf.registerView, {questions: questions, qIndex: qIndex, 
        needsInvitation: pluginConf.needsInvitation, humanTest: pluginConf.humanTest});
    },
    post: function(req,res) {

      var pluginConf = web.plugins['oils-plugin-auth'].conf;
      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }

      var user = new User();
      for (var i in req.body) {
        user[i] = req.body[i];
      }

      delete user._id;

      var qIndex = parseInt(req.body.qIndex);

      var answer = req.body.a || '';

      var errorMsgs = [];

      if (req.body.password != req.body.confirmPassword) {
        errorMsgs.push('Passwords do not match.');
      }

      if (pluginConf.humanTest && questions[qIndex].a != answer.toLowerCase()) {
        errorMsgs.push('Invalid answer to the question.');
      }

      if (pluginConf.needsInvitation && !req.body.invitationCode) {
        errorMsgs.push('Invitation code is required');
      }
      if (errorMsgs.length > 0) {
        for (var i in errorMsgs) {
          req.flash('error', errorMsgs[i]);
        }
        
        res.renderFile(pluginConf.registerView, {user: user, qIndex: qIndex, questions: questions, answer: answer});
        return;
      } 

      
      var dmsUtils = web.cms.utils;
      var invitationPath = '/invites/' + req.body.invitationCode;
      dmsUtils.retrieveDoc(invitationPath, function(err, doc) {
        if (err) throw err;

        if (pluginConf.needsInvitation) {
          if (!doc) {
            req.flash('error', 'Invalid invitation code.');
            res.redirect('/register');
            return;
          }

          user.role = doc.content;
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
            for (var i in err.errors) {
              req.flash('error', err.errors[i].message);
            }
            res.renderFile(pluginConf.registerView, {user: user, qIndex: qIndex, questions: questions, answer: answer});
          } else {
            req.login(user, function(err) {
              if (err) { throw err; }

              req.flash('info', 'Successfully registered and authenticated.');

              return res.redirect('/');
            });

            // var myNext = function() {
            //   req.flash('info', 'Successfully registered and authenticated.');
            //   res.redirect(pluginConf.redirectAfterLogin);
            // }
            // passport.authenticate('local')(req, res, myNext);
            // dmsUtils.deletePath(invitationPath);
          }
        })
      })

      
    }
  }
