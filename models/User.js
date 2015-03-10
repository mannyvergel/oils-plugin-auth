var validator = require('validator');
var bcrypt = web.include('/node_modules/bcrypt'),
    SALT_WORK_FACTOR = 12; // same as nodebb

var emailValidator = [function(val) {
  //console.log('validate Email : %s = %s', val, validator.isEmail(val));
  return validator.isEmail(val);
}, 'Invalid email.'];

var uniqueValidator = require('mongoose-unique-validator');

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

/*var passwordValidator = [function(val) {
  var user = this;
  return user.confirmPassword == user.password;
}, 'Password and Confirm Password do not match.']
*/

var User = {
  name: 'User',
  schema: {
    username: {type: String, index: true, unique: true, required: true, lowercase: true, trim: true},
    password: {type: String, required: true},
    nickname: String,
    fullname: {type: String, required: true},
    email: {type: String, required: true, validate: emailValidator, unique: true, lowercase: true, trim: true},
    role: {type: String, default:'USER'}
  },

  initSchema: function(UserSchema) {

    UserSchema.plugin(uniqueValidator, { message: 'Someone already registered the {PATH} {VALUE}.' });

    UserSchema.pre('save', function(next) {
      var user = this;
     
      // only hash the password if it has been modified (or is new)
      if (!user.isModified('password')) return next();
       
      // generate a salt
      bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
     
        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
          if (err) return next(err);
   
          // override the cleartext password with the hashed one
          user.password = hash;
          next();
        });
      });
     
     
    });

    UserSchema.methods.comparePassword = function(candidatePassword, cb) {
      bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
      });
    };

  }
}




module.exports = User;