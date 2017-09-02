const
	express = require('express')
	request = require('request')
	axios = require('axios')
    bodyParser = require('body-parser')
    port = 3000
    config = require('./config/secret')

const app = express()
app.use(bodyParser.json());

app.get('/webhook',(req,res)=>{
	if(req.query['hub.mode'] === 'subscribe' && 
	   req.query['hub.verify_token'] === config.verify_token) {
		console.log("Validating Webhook")
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error('Failed validation, make sure the tokens match');
		res.sendStatus(403);
	}
})

app.post('/webhook', function (req, res) {
  var data = req.body;
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
        if (event.message) {
        	console.log("Message received")
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event");
        }
      });
    });
    res.sendStatus(200);
  }
});

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.page_access_token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Sent");
    } else {
      console.error("Unable to send message.");
      console.error("Failed Response - 103");
      if(error) {
        console.error("Error - 105");
      }
    }
  });  
}

function sendTextMessage(receipientID, text) {
  console.log("Sending message..")
  var messageData = {
    'recipient': {
      'id': receipientID
    },
    message: {
      'text': text
    }
  }
  callSendAPI(messageData);
}
 
function process(text) {
	return (text.split("").reverse().join(""))
}

function complaint(recipientID) {
	console.log("Complaint")
	sendTextMessage(recipientID, "Complain hogaya re babu.")
}

function receivedMessage(event) {
  if(event.message.is_echo)
  {
    console.log('Received');
  }
  else if(event.message.text)
  {
  	console.log(JSON.stringify(event.message))
  	sendTextMessage(event.sender.id, process(event.message.text))
  }
}



app.get('/',(req,res)=>{
	res.send('<h1>Hello World.</h1>')
})
app.listen(port,()=>{
	console.log("live on ",port)
})
