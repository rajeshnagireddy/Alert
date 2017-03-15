
var express = require('express')
var app = express()
var cron = require('cron');
var request = require('request');
var mailgun = require('mailgun-js');
var lowestBitcoin = 1000000;
var alertPrice = 88000;

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

	    	if(body.buy < alertPrice) {
	    		alertPrice-=500;
	    		sendMail();
	    	}
	    }
	})
}

function sendMail() {
	var api_key = 'key-f6e2d6584d6c0224aa5618cb081041d3';
	var domain = 'sandboxb93db37f6137404d895582a2f8e399ca.mailgun.org';
	var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
	 
	var data = {
	  from: 'Bit coin Alert <bitalert@alert.mailgun.org>',
	  to: 'rajesh.impalerts@gmail.com',
	  subject: "Bit Coin Lowest Price " + lowestBitcoin,
	  text: 'Lowest Bitcoin as of now is ' + lowestBitcoin
	};

	mailgun.messages().send(data, function (error, body) {
	  console.log(body);
	});
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