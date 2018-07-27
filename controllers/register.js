
const passport = require('passport');

const questions = [
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

const pluginConf = web.plugins['oils-plugin-auth'].conf;
const User = web.includeModel(pluginConf.userModel);

module.exports = {

    get: function(req, res) {

      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }
      let qIndex = getRandomInt(0, questions.length-1);
      res.renderFile(pluginConf.registerView, {questions: questions, qIndex: qIndex, 
        needsInvitation: pluginConf.needsInvitation, humanTest: pluginConf.humanTest});
    },
    post: function(req,res) {

      if (!pluginConf.registrationEnabled) {
        throw new Error("Registration is not enabled.");
      }

      let user = new User();
      for (let i in req.body) {
        user[i] = req.body[i];
      }

      delete user._id;

      let qIndex = parseInt(req.body.qIndex);

      let answer = req.body.a || '';

      let errorMsgs = [];

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
        for (let i in errorMsgs) {
          req.flash('error', errorMsgs[i]);
        }
        
        res.renderFile(pluginConf.registerView, {needsInvitation: pluginConf.needsInvitation, user: user, qIndex: qIndex, questions: questions, answer: answer});
        return;
      } 

      
      let dmsUtils = web.cms.utils;
      let invitationPath = '/invites/' + req.body.invitationCode;
      dmsUtils.retrieveDoc(invitationPath, function(err, doc) {
        if (err) throw err;

        if (pluginConf.needsInvitation) {
          if (!doc) {
            req.flash('error', 'Invalid invitation code.');
            res.redirect('/register');
            return;
          }

          web.auth.conf.invitationContentHandler(user, doc);
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
            res.renderFile(pluginConf.registerView, {needsInvitation: pluginConf.needsInvitation, user: user, qIndex: qIndex, questions: questions, answer: answer});
          } else {
            req.login(user, function(err) {
              if (err) { throw err; }

              req.flash('info', 'Successfully registered and authenticated.');
              dmsUtils.deletePath(invitationPath);
              return res.redirect(pluginConf.redirectAfterLogin);
            });

            // let myNext = function() {
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
