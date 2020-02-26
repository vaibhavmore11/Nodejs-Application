const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressJwt = require('express-jwt');
const User = require('../models/user');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail } = require('../helpers');

//sign-up

exports.signup = async (req, res) => {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists)
        return res.status(403).json({
            error: 'User is present! Please enter another email address' // error if email is taken 
        });
    const user = await new User(req.body);
    await user.save();
    res.status(200).json({ message: 'You have created account sucessfully! Please login.' }); // response message after signup
};

// sign-in

exports.signin = (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'Please Create Account' // error will show if email does not exist
            });
        }
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Creditionals does not match' // error message for the password check
            });
        }

        // it generate a token with user id and secret wrriten in .env file

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
        
        // presist the token as 't' in cookie with expiry date

        res.cookie('t', token, { expire: new Date() + 9999 });

        //return response with user and token to frontend application

        const { _id, name, email, role } = user;
        return res.json({ token, user: { _id, email, name, role } }); 
    });
};

// sign-out

exports.signout = (req, res) => {
    res.clearCookie('t');
    return res.json({ message: 'You have Logged Out!' }); // response for signout
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: 'No request body' });  
    if (!req.body.email) return res.status(400).json({ message: 'No Email in request body' }); // message to write email

    console.log('forgot password finding user with that email');
    const { email } = req.body;
    console.log('signin req.body', email);

    //find the user with email

    User.findOne({ email }, (err, user) => {
        if (err || !user)
            return res.status('401').json({
                error: 'User not present with email' // error message if no user present
            });

    // generate a token with user id and secret        

        const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);

    // email data        

        const emailData = {
            from: 'noreply@node-react.com',
            to: email,
            subject: 'Password Reset Instructions',
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        };

        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};

// to allow user to reset password

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

// first you will find the user in the database with user's resetPasswordLink    

    User.findOne({ resetPasswordLink }, (err, user) => {

        if (err || !user)
            return res.status('401').json({
                error: 'Invalid URL!'
            });

        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ''
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

exports.socialLogin = async (req, res) => {
    const idToken = req.body.tokenId;
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.REACT_APP_GOOGLE_CLIENT_ID });
    const { email_verified, email, name, picture, sub: googleid } = ticket.getPayload();

    if (email_verified) {
        console.log(`email_verified > ${email_verified}`);
// try signup by finding user with req.email
        const newUser = { email, name, password: googleid };
        let user = User.findOne({ email }, (err, user) => {
            if (err || !user) {

                // to create a new user and login

                user = new User(newUser);
                req.profile = user;
                user.save();
                //generate a token with user id and secert
                const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
                res.cookie('t', token, { expire: new Date() + 9999 });

                // response with user and token to frontend application
                const { _id, name, email } = user;
                return res.json({ token, user: { _id, name, email } });
            } else {

                //update an existing user 
                req.profile = user;
                user = _.extend(user, newUser);
                user.updated = Date.now();
                user.save();
                const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
                res.cookie('t', token, { expire: new Date() + 9999 });
                // response with user and token to frontend application
                const { _id, name, email } = user;
                return res.json({ token, user: { _id, name, email } });
            }
        });
    }
};

