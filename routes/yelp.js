var express = require('express');
var router = express.Router();
var yelpApi = require('yelp');
var config = require('../config.json');

var yelp = new yelpApi({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  token: config.token,
  token_secret: config.token_secret
})

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  var term = req.query.text;
  
  var sort = 'default_sort'
  if (term.indexOf('best') > -1){
    sort = 'sort_by_highest';
    term = term.replace('best', '').trim();
  }
  else if(term.indexOf('closest') > -1){
    sort = 'sort_by_distance';
    term = term.replace('closest', '').trim();
  }
  
  var opts = createSearchParams(term, sort);
  yelp.search(opts)
    .then(function (data) {
      res.send(formatSlackResponse(data));
    })
    .catch(function (err) {
      console.error(err);
      res.send(formatErrResponse(err));
    });
    
});

module.exports = router;

function formatSlackResponse(yelpResponse){
  var slackResponse = {'response_type':'in_channel'};
  var slackAttachments = [];
  
  for(var i in yelpResponse['businesses']){
    var business = yelpResponse['businesses'][i];
    var attachment = {
      "title":business['name'],
      "title_link":business['url'],
      "thumb_url":business['rating_img_url'],
      "color":getRandomColor(),
      "fields":[
        {
          "title":"Description",
          "value":business['snippet_text']
        },
        {
          "title":"Address",
          "value":business['location'].address[0],
          "short":true
        },
        {
          "title":"Between",
          "value":business['location'].cross_streets,
          "short":true
        }
      ]
    };
    slackAttachments.push(attachment);
  }
  slackResponse.attachments = slackAttachments;
  return slackResponse;
}

function formatErrResponse(err){
  return err;
}

function createSearchParams(term, sort, limit, location){
  
  term = term || config.default_search_term;
  location = location || config.default_search_location;
  limit = limit || config.default_search_limit;
  var sort_value = config[sort];
  
  var searchOptions = {
    "location":location, 
    "term":term,
    "limit":limit,
    "sort":sort_value
  };
  
  return searchOptions;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
