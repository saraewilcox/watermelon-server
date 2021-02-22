const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SpotifyStrategy = require('passport-spotify').Strategy;

//Set the user in the session - login
passport.serializeUser((loggedInUser, cb) => {
  cb(null, loggedInUser._id);
});

//Gets the user from the session req.user
passport.deserializeUser((userIdFromSession, cb) => {
  User.findById(userIdFromSession, (err, userDocument) => {
    if(err) {
      cb(err);
      return;
    }
    cb(null, userDocument);
  });
});

//Authenticate using passport
passport.use(
  new LocalStrategy((username, password, next) => {
    User.findOne({username}, (err,foundUser) => {
      if(err) {
        next(err);
        return;
      }
      if(!foundUser) {
        next(null, false, {message:"Sorry! We couldn't find you username. Try again :) "});
        return;
      }
      if(!foundUser.password) {
        next(null, false, {message:"Sorry! Your password doesn't match with the username. Try again :) "});
        return;
      }
      if(!bcrypt.compareSync(password,foundUser.password)) {
        next(null,false,{message: 'Looks like you enter the wrong password. Try again :)' });
        return;
      }
      next(null,foundUser);
    });
  })
);

//Authenticating Using Spotify
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: '/api/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expiresIn, profile, done) {
      User.findOne({ spotifyId: profile.id })
      .then((user) => {
        if (!user) {
          return User.create({
            spotifyId: profile.id,
            accessToken,
            refreshToken,
            expiresIn,
            displayName: profile.displayName,
            imgURL: (profile.images[0] && profile.images[0].url) || '',
          });
        } else {
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          return user.save();
        }
      })
      .then(user => done(null, user))
      .catch(err => done(err));// closes User.findOne()
    }
  )
);