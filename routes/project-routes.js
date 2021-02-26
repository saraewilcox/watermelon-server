const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { format } = require('morgan');
const Quiz = require('../models/Quiz');
const SpotifyWebAPI = require('spotify-web-api-node');
var { getUserPlaylists } = require('../utils/getAll');

//Route to create quiz

router.post('/quiz', (req, res) => {
  const myQuestions = req.body.questions;
  const userName = req.body.user;
  const playlistTitle = req.body.playlistTitle;
  const playlistDescription = req.body.playlistDescription;
  console.log('this is the request body', req.body);
  const quizCode = Math.floor(1000 + Math.random() * 9000);

  Quiz.create({
    quizCode: quizCode,
    questions: myQuestions,
    users: userName,
    title: playlistTitle,
    description: playlistDescription,
  })
    .then((response) => {
      console.log(`This is the quiz we have just added: ${response}`);
      res.json(response);
    })
    .catch((err) => {
      console.log(`Something went wrong, here is the error: ${err}`);
    });
});

//Get the quiz code and display on frontend
router.get('/quiz/:code', (req, res) => {
  const code = req.params.code;
  Quiz.findOne({ quizCode: code }).then((quiz) => {
    res.json(quiz.quizCode);
  });
});

//Get the Quiz from its quiz code
router.get('/quiz-code/:code', (req, res) => {
  const code = req.params.code;
  Quiz.find({ quizCode: code }).then((quiz) => {
    res.json(quiz);
  });
});

//Add array of songs to the Quiz Model
router.put('/quiz/:quizCode/addsongs', (req, res) => {
  const quizCode = req.params.quizCode;
  const songs = req.body.songs;
  Quiz.findOneAndUpdate(
    { quizCode: quizCode },
    { $push: { songs: songs } },
    { isFinished: true }
  ).then(() => {
    res.json({ message: `quiz with quizCode ${quizCode} was updated` });
  });
});

//Add array of users to the Quiz Model
router.put('/quiz/:code/users', (req, res) => {
  const code = req.params.code;
  const users = req.body.users;
  console.log(req.body);
  Quiz.findOneAndUpdate({ quizCode: code }, { $push: { users: users } }).then(
    () => {
      res.json({ message: `quiz with id ${code} was updated with ${users}` });
    }
  );
});

router.post('/quiz/:code/playlist', (req, res) => {
  const code = req.params.code;
  const access_token = req.body.userToken;
  let playlistURI;
  let playlist = [];
  const spotifyAPI = new SpotifyWebAPI({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  Quiz.findOne({ quizCode: code }).then((quiz) => {
    const songs = quiz.songs;
    console.log(quiz);
    const playlistTitle = quiz.title;
    const playlistDescription = quiz.description;
    let getTrackPromises = [];

    spotifyAPI.setAccessToken(access_token);

    songs.forEach((song) => {
      if (song === '') { (song = "Never Gonna Give You Up")}
      getTrackPromises.push(spotifyAPI.searchTracks(song, { limit: 1 }).then(data => data.body.tracks.items))
    });

    Promise.all(getTrackPromises)
      .then((data) => {
        console.log('promise data: ', data)
        playlist = data.map((data) => {
          console.log('these are uris: ',data.map(x => x.uri))
          return {
            name: data[0].name,
            href: data[0].href,
            preview_url: data[0].preview_url,
            uri: data[0].uri,
          };
        });

        return spotifyAPI.createPlaylist(playlistTitle, {
          description: playlistDescription,
          public: true,
        });
      })
      .then((data) => {
        playlistURI = data.body.uri;
        let playlistID = data.body.id;
        console.log('This is playlistURI:', playlistURI);
        console.log('this is your playlist ', data);
        playlistURIs = playlist.map((song) => {
          return song.uri;
        });
        console.log('these are song uris: ', playlistURIs)

        return spotifyAPI.addTracksToPlaylist(playlistID, playlistURIs);
      })
      .then((data) => {
        res.json(playlistURI);
      })
      .catch((err) => {
        console.log('this is the error', err.message);
      });
  });
});

router.get('/user-playlists', async (req, res, next) => {
  spotifyAPI.setAccessToken(access_token);
  let userplaylists = [];
  try {
      for await (let userplaylist of getUserPlaylists(access_token)) {
          userplaylists.push(userplaylist);
      }

      res.status(200).send(userplaylists);
  } catch (err) {
      console.error(err);
      res.status(err.statusCode).send('Something went wrong');
  }
});

module.exports = router;
