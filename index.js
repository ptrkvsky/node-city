const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');

const regionRoutes = require('./routes/region')
const departementRoutes = require('./routes/departement')
const citiesRoutes = require('./routes/cities')
const pagesRoutes = require('./routes/pages')

const router = require('express').Router();

const app = express();

// Enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.get('/', async function (req, res) {
  res.status(200).send('Hello Team !');
});

// Add other middleware
app.use(cors());
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({limit: '500mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// Routes Middlewares
app.use('/api/regions', regionRoutes);
app.use('/api/departements', departementRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/pages', pagesRoutes);


//start app 
const port = process.env.PORT || 8080;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);