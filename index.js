var express = require('express')
var app = express()
var cron = require('cron');
var request = require('request');
var lowestBitcoin = 1000000;

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Lowest Bitcoin as of now is ' + lowestBitcoin)
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

function checkBitCoinPrice() {
	request('https://api.zebpay.com/api/v1/ticker?currencyCode=INR', function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	    	var body = JSON.parse(body);
	    	if(lowestBitcoin > body.buy) {
	    		lowestBitcoin = body.buy;
	    		console.log('updated --> ' +  body.buy);
	    	}
	    }
	})
}

var job1 = new cron.CronJob({
  cronTime: '*/1 * * * *',
  onTick: checkBitCoinPrice,
  start: false,
  timeZone: 'America/Los_Angeles'
});

job1.start(); 
checkBitCoinPrice();
console.log('job1 status', job1.running);