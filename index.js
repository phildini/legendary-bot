var request = require('request');
var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var wordfilter = require('wordfilter');
var ent = require('ent');
var wordnikKey = require('./permissions.js').key;
var myTweet = "";

// making this URL call easier:

var getAdjURL = 'http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=adjective&minLength=12&maxLength=20&limit=1&api_key=' + wordnikKey;

function tweetWord(word) {
    T.post('statuses/update', { status: word }, function(err, reply) {
        if (err) {
            console.log('error:', err);
        } else {
            console.log('tweet:', reply);
        }
    });
}

function tweetLegend() {
    var adjective = '',
        syllables;
    //let's get some adjectives!
    request(getAdjURL, function(error, response, data) {
        // let's make sure we're dealing with JSON
        var adjSet = JSON.parse(data);
        if (!error) {
            // if we got back some data from the API and it didn't error
            for (var i = 0; i < adjSet.length; i++) {
                if (!wordfilter.blacklisted(adjSet[i].word)){
                console.log(adjSet[i].word);
                    if (adjSet[i].word.indexOf('-') === -1) {
                        var checkWordUrl = 'http://api.wordnik.com:80/v4/word.json/' + adjSet[i].word + '/hyphenation?useCanonical=false&limit=50&api_key=' + wordnikKey,
                            syllables = [];
                        console.log(checkWordUrl);
                        request(checkWordUrl, function(error, response, data){
                            syllables = JSON.parse(data);
                            if (!error && syllables.length > 1) {
                                console.log(syllables);
                                var plugged = false;
                                adjective = "It's going to be ";
                                for (var j = 0; j < syllables.length; j++) {
                                    adjective += syllables[j].text.toUpperCase();
                                    if ((j != syllables.length -1) && syllables[j+1].type === "stress" && !plugged) {
                                        plugged = true;
                                        adjective += '- ...wait for it... -';
                                    }
                                }
                                adjective += '!'
                                console.log(adjective);
                                tweetWord(adjective);
                                return;
                            } else {
                                tweetLegend();
                                return;
                            }
                        });
                        if (adjective) {
                            return;
                        }
                    } else {
                        adjective = "It's going to be ";
                        var broken = adjSet[i].word.split('-');
                        var plugged = false;
                        var together = broken[0].toUpperCase() + '- ...wait for it... -' + broken[1].toUpperCase();
                        adjective += together;
                        adjective += '!'
                        console.log(adjective);
                        tweetWord(adjective);
                        return;
                    }
                }
            }
        }
    });
}

// Tweet every 30 minutes
setInterval(function () {
    try {
        tweetLegend();
    }
    catch (e) {
        console.log(e);
    }
}, 1000 * 60 * 30);

// Tweet once on initialization
tweetLegend();
