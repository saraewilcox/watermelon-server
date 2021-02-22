require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
/* const favicon      = require('serve-favicon'); */
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

require('./configs/passport');

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });

const app_name = require('./package.json').name;
const debug = require('debug')(
  `${app_name}:${path.basename(__filename).split('.')[0]}`
);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(express.static(path.join(__dirname, 'dist')));
/* app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico'))); */

//Session
app.use(
  session({
    secret: 'projectapp',
    cookie: { expire: 60000 }, // expires in one hour.
    rolling: true, //if you keep using the applicaiton it won't expire
  })
);

app.use(passport.initialize());
app.use(passport.session());

// default value for title local
app.locals.title = 'kahootify - spotify blended with kahoot';

//Allowing our frontend to get resources from our Backend
app.use(
  cors({
    credentials: true,
    origin: [process.env.CLIENT_HOSTNAME], 
    //origin: ['https://watermelon-jams.herokuapp.com'], //where the requests come from, is the url of the frontend. The Backend must allow FrontEnd.
  })
);

app.get("/try", (req, res) => {
  res.send("working!!!")
})

const index = require('./routes/index');
app.use('/', index);

const authRoutes = require('./routes/auth-routes.js');
app.use('/api', authRoutes);

const projectRoutes = require('./routes/project-routes.js');
app.use('/api', projectRoutes);

module.exports = app;
