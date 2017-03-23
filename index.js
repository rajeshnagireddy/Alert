
var express = require('express')
var app = express()
var cron = require('cron');
var request = require('request');
var mailgun = require('mailgun-js');
var admin = require("firebase-admin");
var serviceAccount = require("./bitcoin-rate-chart-firebase-adminsdk-prh1h-b86a4ae7b4.json");
var lowestBitcoin = 1000000;
var alertPrice = 88000;
var sellAlertPrice = 90000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bitcoin-rate-chart.firebaseio.com"
});

var database = admin.database();
var alertsRef = database.ref("/alerts");
alertsRef.on("value", function(snapshot) {
  var data = snapshot.val();
  alertPrice = data.alertPrice;
  lowestBitcoin = data.lowestPrice;
});

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
	    		updateLowestPrice(body.buy);
	    		console.log('updated --> ' +  body.buy);
	    	}

	    	if(body.buy < alertPrice) {
	    		alertPrice-=500;
	    		updateAlertPrice(alertPrice);
	    		sendMail();
	    	}

	    	if(body.sell > sellAlertPrice) {
	    		sellAlertPrice+=500;
	    		sendMail();
	    	}

	    	addPriceToChart(body);
	    }
	})
}

function sendMail() {
	var api_key = 'key-f6e2d6584d6c0224aa5618cb081041d3';
	var domain = 'sandboxb93db37f6137404d895582a2f8e399ca.mailgun.org';
	//var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
	 
	var data = {
	  from: 'Bit coin Alert <bitalert@alert.mailgun.org>',
	  to: 'rajesh.impalerts@gmail.com,rajesh.rnagireddy@gmail.com,rajesh.nagireddy@practo.com',
	  subject: "Bit Coin Lowest Price " + lowestBitcoin,
	  text: 'Lowest Bitcoin as of now is ' + lowestBitcoin
	};

	// mailgun.messages().send(data, function (error, body) {
	//   console.log(body);
	// });
}

function updateLowestPrice(price) {
	alertsRef.update({
		lowestPrice : price,
		modifiedAt: {".sv":"timestamp"}
	})
}

function updateAlertPrice(price) {
	alertsRef.update({
		alertPrice : price,
	})	
}

function addPriceToChart(response) {
	database.ref().child('/rateChart').push().set({
		buy : response.buy,
		sell : response.sell,
		market : response.market,
		volume : response.volume,
		createdAt : {".sv":"timestamp"} 
	});
}

var job1 = new cron.CronJob({
  cronTime: '*/1 * * * *',
  onTick: checkBitCoinPrice,
  start: false,
  timeZone: 'America/Los_Angeles'
});

job1.start();
console.log('job1 status', job1.running);
