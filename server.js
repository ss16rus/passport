class User {
    constructor( id, name ) {
        this.id = id;
        this.name = name;
    }
}

const sessionsId = new Map();

let userList = [new User(1, "Sunil"), new User(2, "Sukhi")];

const session = require('express-session');
const express = require('express');
const app = express();

// passport library
const passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;

app.use(express.static(__dirname));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use( bodyParser.urlencoded({ extended: false }));

const flash = require('connect-flash');
app.use(flash());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }));

// passport middleware invoked on every request to ensure session
// contains passport.user object
app.use(passport.initialize());
// load serialized session user object to req.user
app.use(passport.session());

// Only during the authentication to specify what user information
// should be stored in the session.
passport.serializeUser(function(user, done) {
  const userId = Math.round(Math.random() * 1000)
  console.log("Serializer : ", user, " userId:", userId);
  sessionsId.set( userId, user );
  done(null, userId);
});

// Invoked on every request by passport.session
passport.deserializeUser(function(id, done) {
  console.log("D-serializer id : ", id);
  const user = sessionsId.get(id);
  if ( user == undefined ) {
    console.log("D-serializer user error");
    done(new Error('Session authentication error'));
  } else {
    console.log("D-serializer user : ", user);
    done(null, user);
  }
});


  // passport strategy:
  // Only invoked on the route which uses the passport.authenticate middleware.
  passport.use(new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password'
  },
    function (username, password, done) {
      console.log("Strategy : Authenticating if user is valid for:", username)
      let user = userList.filter(user => username === user.name)

      if (user.length == 0) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // if (!user.password === password ) {
      //   return done(null, false, { message: 'Incorrect password.' });
      // }

      return done(null, user);
    }
  ));


  app.post('/login',
    passport.authenticate('local',{
      successRedirect: '/',
      failureRedirect: '/',
      failureFlash: true
    }),
    function(req, res) {
      console.log('User is authenticated', req.user)
      // If this function gets called, authentication was successful.
      // `req.user` contains the authenticated user.
      // res.redirect('/users/' + req.user.username);
      res.end('login success');
    }
  )

  // request interceptor that will check user authentication
  isAuthenticated = (req, res, next) => {
    console.log("Authenticating :", req.originalUrl)
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'User is unauthenticated');
    res.redirect('/failure');
  };


  app.post('/test', isAuthenticated, (req, res) => {
      console.log( "Data: ", req.body.some_field );
      res.end('Test successful');
  })


  app.get('/failure', function(req, res){
    // Get an array of flash messages by passing the key to req.flash()
    // res.render('index', { messages: req.flash('info') });
    const message = req.flash('error');
    console.log('Error', message );
    res.json( message );
  });



app.listen( 3000, () => console.log('App listening on 3000'));
