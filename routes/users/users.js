const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const cloudUpload = require("../../config/cloudinary-setup");
const avatarSelectors = require("../../data/random-avatar-selectors.enum");

// Here will create a route to lead to the users profile page in order to allow the user to modify and update their information.
// Since we have currentUser set up as a local variable in the app.js, we will not have to get the users details from the DB prior to loading the details page.
// this route will allow the current user to view their profile and also be able to edit their profile.
router.get("/profile", (req, res, next) => {
    // here I will create a variable in session called avatarSelectors in order to pass it as a variable in order to use the data in user profile. Since this is the route that will run every time that I load the users profile, there will be no need to have to add this line somewhere else.

    // now we will create an object that we can use for both the value and display name of the selector properties that we created our data file for.
    const avatarObject = {
        selector: [],
        mood: []
    };

    // we have to iterate over the original array to create another array of names that has the first letter of the string capitalized so that it will display the name correctly instead of everything in lowercase.
    for (let elem of avatarSelectors.avatarType) {
        avatarObject.selector.push({
            value: elem,
            name: `${elem.charAt(0).toUpperCase()}${elem.slice(1)}`
        });
    }
    // we will do this for both arrays that we are retrieving from our data file
    for (let elem of avatarSelectors.avatarMood) {
        avatarObject.mood.push({
            value: elem,
            name: `${elem.charAt(0).toUpperCase()}${elem.slice(1)}`
        });
    }
    res.render("users/userProfile", { avatarSelectors: avatarObject });
});

// this route will be so that we can update the users profile information if they edit any of the fields. Since each sessions user is unique then we can create a route without having to pass the users id in the endpoint.
router.post("/profile/update", (req, res, next) => {
    // since this route has a similar endpoint as the profile route when seeing another users profile, we have to add this route first so that when your app checks the routes in this file (starts at top and works its way down), then it will find this route first and not confuse the /update as being a /:userId since the id can be anything.
    User.findByIdAndUpdate(req.session.user._id, req.body, { new: true })
        .then(updatedUser => {
            // we have to remember to set the user information after its been updated to req.session.user or the currentUser local variable we set up in app.js will have the old user info and wont display the changes
            req.session.user = updatedUser;
            res.redirect("back");
        })
        .catch(err => next(err));
});

// this route will be for generating a random sprite for the users avatar. We will be able to update just the avatar field with this route and have users generate a sprite from an api.
router.post("/profile/avatar", (req, res, next) => {
    const dataObj = req.body;
    dataObj.mood = req.body.mood ? req.body.mood : "happy";

    // for the api that we are using we don't have to call on it in order to user it. We just have to save the api's url with the needed parameters and it will display the generated image as if it were a normal image url.
    User.findByIdAndUpdate(
        req.session.user._id,
        {
            avatar: `https://avatars.dicebear.com/v2/${dataObj.spriteType}/${dataObj.wordIdentifier}.svg?options[mood][]=${dataObj.mood}`
        },
        { new: true }
    )
        .then(updatedUser => {
            // we have to remember to set the user information after its been updated to req.session.user or the currentUser local variable we set up in app.js will have the old user info and wont display the changes
            req.session.user = updatedUser;
            res.redirect("back");
        })
        .catch(err => next(err));
});

// on this route like the above route we will create an update for the users avatar. Though on this route we wont generate a sprite, we will instead allow the user to upload an image from their pc
// you'll notice that this route has something that the other do not, it has cloudUpload.single('uploadedImage'). This is used to first send the image file info to cloudinary and run through the setup process. It will save the image file online and then return a url that we can then use to display that image. The return value for this will be file.url and file is added to your request. So in order to grab the url we would call req.file.url
router.post(
    "/profile/file-upload",

    cloudUpload.single("uploadedImage"),
    (req, res, next) => {
        User.findByIdAndUpdate(
            req.session.user._id,
            { avatar: req.file.url },
            { new: true }
        )
            .then(updatedUser => {
                // we have to remember to set the user information after its been updated to req.session.user or the currentUser local variable we set up in app.js will have the old user info and wont display the changes
                req.session.user = updatedUser;
                res.redirect("back");
            })
            .catch(err => next(err));
    }
);

// this route will lead to the same profile page as the above route but instead will be for when a user is visiting another users profile which will display the information only and not allow the current user to edit the profile.
router.get("/profile/:userId", (req, res, next) => {
    User.findById(req.params.userId)
        .then(userFromDB => {
            res.render("users/userProfile", { userFromDB });
        })
        .catch(err => next(err));
});

module.exports = router;
