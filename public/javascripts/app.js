var Songkick = function(apiKey){
  this.baseUrl = 'http://api.songkick.com/api/3.0/';
  this.apiKey = apiKey;
}
Songkick.prototype.userEvents = function(username, callback){
  this.get('users/' + username + '/events', {
    reason: 'tracked_artist',
    attendance: 'all'
  }, callback);
}
Songkick.prototype.get = function(resource, opts, callback){
  opts['apikey'] = this.apiKey;
  $.getJSON(this.baseUrl + resource + ".json?jsoncallback=?", opts, callback);
}

var Foursquare = function(clientId, clientSecret){
  this.clientId = clientId;
  this.clientSecret = clientSecret;
  this.baseUrl = 'https://api.foursquare.com/v2/';
}
Foursquare.prototype.venues = function(lat, lng, name, callback){
  this.get('venues/search', {
    ll: lat+","+lng,
    query: name,
    intent: 'match'
  }, callback);
}
Foursquare.prototype.get = function(resource, opts, callback){
  opts['client_id'] = this.clientId;
  opts['client_secret'] = this.clientSecret;
  opts['v'] = '20131207';
  $.getJSON(this.baseUrl + resource, opts, callback);
}

var untappd = function(venueId, callback){
  $.getJSON('/beers/search', {venueId: venueId}, callback);
}

var s = new Songkick(window.env.songkickApiKey),
    f = new Foursquare(window.env.foursquareClientId, window.env.foursquareClientSecret),
    $form = $('form'),
    $button = $form.find('button'),
    $username = $form.find('input'),
    $events = $('.events');

$events.on('click', 'li a.find', function(e){
  e.preventDefault();
  var $link = $(this),
      $parent = $link.parents('li'),
      $tweet = $('<a class="tweet">');
  $parent.spin('small');
  $link.remove();
  f.venues($link.data('lat'), $link.data('lng'), $link.data('name'), function(data){
    console.log(data);
    var twitterName = data.response.venues[0].contact.twitter,
        venueName = data.response.venues[0].name;
    untappd(data.response.venues[0].id, function(data){
      console.log(data);
      var tweetText, tweetUrl;
      $parent.spin(false);
      var beerCount = data.response.venue.top_beers.count,
          beers = data.response.venue.top_beers.items,
          $list = $('<ol>'),
          i, len, element;
      if(beerCount > 0){
        for(i=0, len=beers.length; i<len; i++){
          element = $('<li>' + beers[i].beer.beer_name + '</li>');
          $list.append(element);
        }
        tweetText = encodeURIComponent('Hey @' + twitterName + ', your choice of beer is terrible');
        tweetUrl = encodeURIComponent('http://beerhear.philna.sh/shame/'+encodeURIComponent(venueName)+'/'+encodeURIComponent(beers.map(function(b){ return b.beer.beer_name }).join(',')));
        $tweet.attr('href','https://twitter.com/intent/tweet?text='+tweetText+'&url='+tweetUrl);
        $tweet.addClass('button');
        $tweet.text('Crap beer? Tweet at them!');
      }else{
        $list.append('<li>No beers checked in here</li>');
      }
      $parent.append($list);
      $parent.append($tweet);
    });
  });
});

$form.on('submit', function(e){
  e.preventDefault();
  var username = $username.val();
  $button.css({color: '#212121'}).spin('small', '#f8f8f8');
  $events.empty();
  s.userEvents(username, function(data){
    console.log(data);
    var events = data.resultsPage.results.event,
        element;
    $button.spin(false).css({color: '#f8f8f8'});
    if(events){
      for(var i=0, len=events.length; i<len; i++){
        element = $('<li><h2>'+events[i].displayName+'</h2><a href="#" class="button find">Find beers</a></li>');
        element.find('a').attr({
          'data-lat': events[i].venue.lat,
          'data-lng': events[i].venue.lng,
          'data-name': events[i].venue.displayName
        });
        $events.append(element);
      }
    }else{
      $events.append('<li>You have no upcoming gigs</li>');
    }
  });
});

