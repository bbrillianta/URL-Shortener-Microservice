const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const { userInfo } = require('os');
const { v4: uuidv4 } = require('uuid');
const validUrl = require('valid-url');
const mongoConn = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

// Basic Configuration
const port = process.env.PORT;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Schema configuration
const { Schema } = mongoose;

const urlSchema = new Schema({
  long_url: String,
  short_url: String
});

//Model configuration
const Url = mongoose.model('Url', urlSchema, 'url');

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new', async (req, res) => {
  const { url } = req.body;

  try {
    if(validUrl.isWebUri(url)) {
      const newUrl = new Url({ long_url: url, short_url: uuidv4() });

      const exist = await Url.findOne({long_url: url});

      if(exist == null) {
        const newDoc = await newUrl.save();
        res.json({ original_url: newDoc.long_url, short_url: newDoc.short_url });
      } else {
        res.json({ original_url: exist.long_url, short_url: exist.short_url });
      }
    } else { res.json({ error: 'invalid url' }); }
  } catch(e) {
    console.log(e);
  }
}); 

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;
  try {
    const exist = await Url.findOne({ short_url: short_url });
    if(exist) { res.redirect(exist.long_url); }
    else { res.json({ error: 'invalid url' }); }
  } catch(e) {
    console.log(e);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
