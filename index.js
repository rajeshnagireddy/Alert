var express = require('express')
var app = express()
//var cron = require('cron');

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})


var job1 = new cron.CronJob({
  cronTime: '*/1 * * * *',
  onTick: function() {
    console.log('job 1 ticked');
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});

job1.start(); // job 1 started

console.log('job1 status', job1.running); // job1 status true