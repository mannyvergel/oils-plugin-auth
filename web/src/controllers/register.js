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


  var User = web.includeModel(pkg.oils.userModel);
module.exports = {

    get: function(req, res) {
      var qIndex = getRandomInt(0, questions.length-1);
      res.renderFile(pkg.oils.registerView, {questions: questions, qIndex: qIndex});
    },
    post: function(req,res) {

      var user = new User();
      for (var i in req.body) {
        user[i] = req.body[i];
      }

      var qIndex = parseInt(req.body.qIndex);

      var answer = req.body.a || '';
      if (questions[qIndex].a != answer.toLowerCase()) {
        req.flash('error', 'Invalid answer to the question.');
        res.renderFile(pkg.oils.registerView, {user: user, qIndex: qIndex, questions: questions, answer: answer});
        return;
      } 


      user.save(function(err) {

        if (err) {
          console.log('Error saving: ' + err);
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          }

          res.renderFile(pkg.oils.registerView, {user: user, qIndex: qIndex, questions: questions, answer: answer});
        } else {
          var myNext = function() {
            req.flash('info', 'Successfully registered and authenticated.');
            res.redirect(pkg.oils.redirectAfterLogin);
          }
          passport.authenticate('local')(req, res, myNext);
          
        }
      })
    }
  }
