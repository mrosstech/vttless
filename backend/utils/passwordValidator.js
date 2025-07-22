
const zxcvbn = require('zxcvbn'); // Add this package for password strength estimation

const passwordValidator = {
    minLength: 8,
    maxLength: 128,
    
    async validate(password, email = '', username = '') {
        const errors = [];
        
        // Basic length checks
        if (password.length < this.minLength) {
            errors.push(`Password must be at least ${this.minLength} characters long`);
        }
        if (password.length > this.maxLength) {
            errors.push(`Password must be less than ${this.maxLength} characters`);
        }

        // Use zxcvbn for strength checking (more user-friendly than rigid rules)
        const strength = zxcvbn(password, [email, username]);
        if (strength.score < 2) {
            errors.push('Password is too weak. Try making it longer or adding more variety');
        }

        // Check if password contains personal information
        if (this.containsPersonalInfo(password, email, username)) {
            errors.push('Password cannot contain parts of your email or username');
        }
        console.log(errors);
        return {
            isValid: errors.length === 0,
            errors,
            score: strength.score,
            feedback: strength.feedback
        };
    },

    containsPersonalInfo(password, email, username) {
        const personalInfo = [
            email?.split('@')[0],
            username,
            email?.split('@')[1]?.split('.')[0] // domain name
        ].filter(Boolean);

        return personalInfo.some(info => {
            if (info && info.length > 3) {
                return password.toLowerCase().includes(info.toLowerCase());
            }
            return false;
        });
    }
};

module.exports = passwordValidator;
