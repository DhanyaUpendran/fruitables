const express = require ('express');
const multer =require("multer");
const path = require('path');
const bodyParser = require ('body-parser');
const mongoose = require('mongoose');
const session = require ('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const app = express();
const port= 3000;
require('dotenv').config();
// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));



const db_URL = process.env.db_URL;
// Connect to MongoDB using Mongoose
mongoose.connect(db_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

//session handling
  const store = new MongoDBStore({
    uri:db_URL,
    collection: 'sessions'
});



app.use(session ({
    secret: 'your-secret-key', // Use a long, random string for better security
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Session expiration time (e.g., 1 day)
    }
}));


// Set up multer for file uploads


app.use('/',userRoute);
app.use('/admin',adminRoute);



app.listen(port,()=>{
    console.log(`connected on port ${port}`);
})


