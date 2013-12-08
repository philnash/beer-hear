var express = require('express'),
    untappdClient = require('node-untappd'),
    app = express(),
    port = process.env.PORT || 3000,
    untappd = new untappdClient(false),
    expressLayouts = require('express-ejs-layouts'),
    untappdClientId = process.env.UNTAPPD_CLIENT_ID,
    untappdClientSecret = process.env.UNTAPPD_CLIENT_SECRET;

untappd.setClientId(untappdClientId);
untappd.setClientSecret(untappdClientSecret);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.logger());
app.use(express.compress());
app.use(express.methodOverride());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('public'))
app.use(expressLayouts)
app.use(app.router)


// make a custom html template

app.get('/', function(req, res){
  res.render('index');
});

app.get('/shame/:venue/:beers', function(req, res){
  var beers = req.params.beers.split(',');
  if(beers.length > 1){
    beers = beers.slice(0, beers.length-1).join(', ') + ' and ' + beers.slice(beers.length-1);
  }else{
    beers = beers[0];
  }
  res.render('shame', {
    venue: req.params.venue,
    beers: beers
  });
});

app.get('/beers/search', function(req, res){
  console.log(req.query.venueId);
  untappd.foursquareVenueLookup(function(err, response){
    console.log("venue lookup err: " + err);
    console.log("venue lookup response: " + response);
    if(err){
      console.log(err);
    }else{
      if(response.response){
        untappd.venueInfo(function(err, feed){
          if(err){
            console.log(err);
          }else{
            res.json(feed);
          }
        }, response.response.venue.items[0].venue_id);
      }
    }
  }, req.query.venueId);
});

app.listen(port);
console.log('Listening on port ' + port);
