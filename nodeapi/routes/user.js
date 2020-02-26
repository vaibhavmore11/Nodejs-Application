const express = require("express");
const {
    userById,
    allUsers,
    getUser,
    updateUser,
    deleteUser,
    userPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower,
    findPeople,
    hasAuthorization
} = require("../controllers/user");
const { requireSignin } = require("../controllers/auth");

const router = express.Router();

// routes to follow and unfollow

router.put("/user/follow", requireSignin, addFollowing, addFollower);
router.put("/user/unfollow", requireSignin, removeFollowing, removeFollower);

// routes to get all users, a user, update user, delete user

router.get("/users", allUsers);
router.get("/user/:userId", requireSignin, getUser);
router.put("/user/:userId", requireSignin, hasAuthorization, updateUser);
router.delete("/user/:userId", requireSignin, hasAuthorization, deleteUser);

// route to get photo by userId

router.get("/user/photo/:userId", userPhoto);

// route to search a user

router.get("/user/findpeople/:userId", requireSignin, findPeople);

// any route containing: userId
router.param("userId", userById);

module.exports = router;
