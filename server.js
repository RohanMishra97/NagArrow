const
	express = require('express')
	request = require('request')
	axios = require('axios')
    bodyParser = require('body-parser')
    port = 3000
    config = require('./config/secret')


var complaintState = "inactive"
var dept = "NULL"
const app = express()
app.use(bodyParser.json());

var dummy = {
	first_name: "Rohan",
	last_name: "Mishra",
	user_id: 1379630258821416,
	phone: 9810953962,
	email: "rohan.mishra1997@gmail.com"
}


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

  var ok = true
  try {
  	var val = data.entry[0].messaging[0]
  } catch(e) {
  	ok = false
  }
  if (data.object === 'page' && ok) {
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
      	if(event.postback) {
      		console.log("Getting Started!")
      		sendIntroText(event.sender.id)
      	}
        if (event.message) {
        	console.log("Message received")
          receivedMessage(event);
        } else {
          //console.log("Webhook received unknown event");
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
function sendIntroText(recipientID) {
	sendTextMessage(recipientID, "Hey I'm Cody!")
}
function complaint(recipientID) {
	var messageData = {
		'recipient': {
			'id': recipientID
		},
		message: {
			"text": "Choose Department",
			"quick_replies": [
				{
					"content_type": "text",
					"title": "Water",
					"payload": "WATER_DIVISION"
				},
				{
					"content_type": "text",
					"title": "Electricity",
					"payload": "ELECTRICITY_DIVISION"
				},
				{
					"content_type": "text",
					"title": "Medical",
					"payload": "MEDICAL_DIVISION"
				},
				{
					"content_type": "text",
					"title": "Police",
					"payload": "POLICE_DIVISION"
				}
			]
		}
	}
	callSendAPI(messageData)
}

function getLocation(recipientID) {
	var messageData = {
		'recipient': {
			'id': recipientID
		},
		message: {
			"text": "Please send your location",
			"quick_replies": [
				{
					"content_type": "location",
				}
			]
		}
	}
	callSendAPI(messageData)
}

function receivedMessage(event) {
	if("postback" in event) {
		console.log("BEER")
		sendTextMessage(event.sender.id, "Hey I'm Cody!")
	}
  else if(event.message.is_echo)
  {
    console.log('Received');
  }
  else if(event.message.text)
  {
  	if(complaintState === "inactive" && Object.keys(event.message.nlp).length != 0 && Object.keys(event.message.nlp.entities).length != 0 && event.message.nlp.entities.intent.length > 0) {	  	
	  	if(event.message.nlp.entities.intent[0].value === "complaint") {
	  		complaintState = "intentactive"
	  		complaint(event.sender.id)
	  	} else if(event.message.nlp.entities.intent[0].value === "sos") {
	  		sendTextMessage(event.sender.id, "Emergency numbers : \nPolice : 5551115555\nFire : 5552225555\nAmbulance : 5553335555")
	  	} else if(event.message.nlp.entities.intent[0].value === "info") {
	  		info(event.sender.id)
	  	}
	} else {
		if(complaintState === "intentactive") {
			complaintState = "setlocation"
			dept = event.message.text
			getLocation(event.sender.id)
		} else if(complaintState === "deptchosen") {
			console.log(`Department: ${dept}\nComplaint: ${event.message.text}`)
			sendTextMessage(event.sender.id, `Sending your ticket to ${dept} Division. We'll get back to you soon!`)
			complaintState = "inactive"
			dept = "NULL"
		} else {
			sendTextMessage(event.sender.id, process(event.message.text))
			complaintState = "inactive"
		}
	} 
  } else if (complaintState === "setlocation") {
  	complaintState = "deptchosen"
	sendTextMessage(event.sender.id, "State your complaint")
  } else {
  	console.log("*")
  }
}

app.post("/emergency",(req, res)=>{
	sendTextMessage(dummy.user_id, "Cyclone in Khandagiri")
	res.status(200).send("Sent")
})



app.get('/',(req,res)=>{
	res.send('<h1>Hello World.</h1>')
})
app.listen(port,()=>{
	console.log("live on ",port)
})
