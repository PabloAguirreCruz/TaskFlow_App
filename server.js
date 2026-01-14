const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import controllers
const authController = require('./controllers/auth');
const tasksController = require('./controllers/tasks');
const categoriesController = require('./controllers/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Heroku
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Database connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.log(`MongoDB connection error: ${err}`);
});

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
    proxy: process.env.NODE_ENV === 'production',
  })
);

// Pass user to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/tasks');
  } else {
    res.render('index');
  }
});

// Controller routes
app.use('/auth', authController);
app.use('/tasks', tasksController);
app.use('/categories', categoriesController);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});