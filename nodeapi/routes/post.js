const express = require('express');
const {
    getPosts,
    createPost,
    postsByUser,
    postById,
    isPoster,
    updatePost,
    deletePost,
    photo,
    singlePost,
    like,
    unlike,
    comment,
    uncomment,
    updateComment
} = require('../controllers/post');
const { requireSignin } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { createPostValidator } = require('../validator');

const router = express.Router();

router.get('/posts', getPosts);

// route to like and unlike

router.put('/post/like', requireSignin, like);
router.put('/post/unlike', requireSignin, unlike);

// route to post comments

router.put('/post/comment', requireSignin, comment);
router.put('/post/uncomment', requireSignin, uncomment);
router.put('/post/updatecomment', requireSignin, updateComment);

// to post routes

router.post('/post/new/:userId', requireSignin, createPost, createPostValidator);
router.get('/posts/by/:userId', requireSignin, postsByUser);
router.get('/post/:postId', singlePost);
router.put('/post/:postId', requireSignin, isPoster, updatePost);
router.delete('/post/:postId', requireSignin, isPoster, deletePost);

// to get photo by photoId

router.get('/post/photo/:postId', photo);

// any route containing: userId

router.param('userId', userById);

// any route containing: postId

router.param('postId', postById);

module.exports = router;
