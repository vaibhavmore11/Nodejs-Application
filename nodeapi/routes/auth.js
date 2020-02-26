const express = require('express');
const { signup, signin, signout, forgotPassword, resetPassword, socialLogin } = require('../controllers/auth');
const { userSignupValidator, userSigninValidator, passwordResetValidator } = require('../validator');
const { userById } = require('../controllers/user');

const router = express.Router();

// signin, signup, signout routes

router.post('/signup', userSignupValidator, signup);
router.post('/signin', userSigninValidator, signin);
router.get('/signout', signout);

// password forgot and reset routes

router.put('/forgot-password', forgotPassword);
router.put('/reset-password', passwordResetValidator, resetPassword);

// to login using gmail

router.post('/social-login', socialLogin);

//to excute userId (route) 

router.param('userId', userById);

module.exports = router;
