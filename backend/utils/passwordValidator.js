
const zxcvbn = require('zxcvbn'); // Add this package for password strength estimation

const passwordValidator = {
    minLength: 8, // Increased from 8 for better security
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

        // Character type requirements
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        // // Check for repeating characters (e.g., 'aaa')
        // if (/(.)\1{2,}/.test(password)) {
        //     errors.push('Password cannot contain three or more repeating characters');
        // }

        // // Check for sequential characters
        // if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i.test(password)) {
        //     errors.push('Password cannot contain sequential characters');
        // }

        // Check for keyboard patterns
        // if (/qwert|asdfg|zxcvb/i.test(password)) {
        //     errors.push('Password cannot contain keyboard patterns');
        // }

        // Use zxcvbn for additional strength checking
        const strength = zxcvbn(password, [email, username]);
        if (strength.score < 3) {
            errors.push('Password is too weak. Try making it longer or more complex');
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
