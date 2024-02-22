const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    roles: [
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role"
        }
    ],
    profilePicture: { type: String, required: false }
    
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (user.isModified('password')) {
        console.log("Password has been modified... running encryption");
        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function(err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            })
        }); 
    }
});



UserSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.usernameExists = async function(username) {
    return await this.findOne({username});
}

UserSchema.methods.emailExists = async function(email) {
    return await this.findOne({email})
}

UserSchema
const User = mongoose.model('User', UserSchema);

module.exports = User;