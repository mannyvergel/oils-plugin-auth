'use strict';

const validator = require('validator');
const bcrypt = require('bcrypt');

const emailValidator = [function(val) {
  //console.log('validate Email : %s = %s', val, validator.isEmail(val));
  return validator.isEmail(val);
}, 'Invalid email.'];

const mongoose = web.require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

/*let passwordValidator = [function(val) {
  let user = this;
  return user.confirmPassword == user.password;
}, 'Password and Confirm Password do not match.']
*/

let User = {
  name: 'User',
  schema: {
    username: {type: String, index: true, unique: true, required: true, lowercase: true, trim: true},
    password: {type: String, required: true},
    birthday: {type: Date},
    nickname: {type: String},
    fullname: {type: String, required: true},
    email: {type: String, required: true, validate: emailValidator, unique: true, index: true, lowercase: true, trim: true},
    role: {type: String, default:'USER'},
    avatar: {type: String},
    addtlData: {},

    failCount: {type: Number, default: 0, required: true},
    lastFailDt: {type: Date},

    status: {type: String, default: 'A'}, // L - Locked

    //verified: {type: String, default: 'N'},
    //verifyKey: {type: String},

    updateDt: {type: Date, default: Date.now},
    updateBy: {type: String, default: 'SYSTEM'},
    createDt: {type: Date, default: Date.now},
    createBy: {type: String, default: 'SYSTEM'}
  },

  initSchema: function(UserSchema) {
    let pluginConf = web.plugins['oils-plugin-auth'].conf;


    UserSchema.pre('save', function(next, req) {
      let user = this;
      
      user.updateDt = new Date();
      if (req && req.user) {
        user.updateBy = req.user._id;
      }

      if (!user.status) {
        user.status = "A";
      }

      if (user.isModified('status') && user.status === "A") {
        user.failCount = 0;
      }

      // only hash the password if it has been modified (or is new)
      if (!user.isModified('password')) return next();

      // reset fail count when password is modified (e.g. reset password)
      user.failCount = 0;
      if (user.status !== "A") {
        user.status = "A";
      }

      if (pluginConf.saltRounds < 10) {
        console.warn("Hashing salt rounds (auth.saltRounds) is too low. Consider increasing to at least 10.");
      }

      // generate a salt
      bcrypt.genSalt(pluginConf.saltRounds || 12, function(err, salt) {
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

    UserSchema.methods.resetFailCount = async function() {
      const UserDbm = web.models('User');
      const userId = this._id;
      await UserDbm.updateOne({_id: userId}, {$set: {failCount: 0}}).exec();
    }

    UserSchema.methods.incrementFailCount = async function() {
      const dbObj = web.models('User');
      let updatedObj = await dbObj.findOneAndUpdate({_id: this._id}, 
        {$inc: {failCount: 1}, $set: {lastFailDt: new Date()}},
        {new: true}).exec();

      console.warn("Failed login:", updatedObj.email, updatedObj.failCount, pluginConf.failCountLock);

      if (updatedObj.failCount >= pluginConf.failCountLock && updatedObj.status !== "L") {
        console.warn("Locking user:", updatedObj.email, updatedObj._id)
        updatedObj.status = "L";
        await updateRes.save();
      }
    }

    UserSchema.methods.comparePassword = function(candidatePassword, cb) {
      bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
      });
    };

  }
}




module.exports = User;