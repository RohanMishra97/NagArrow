const
express = require('express')
request = require('request')
axios = require('axios')
bodyParser = require('body-parser')
path = require('path')
port = 3000
config = require('./config/secret')


var complaintState = "inactive"
var dept = "NULL"
const app = express()
var complaints = []

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.set("views",path.resolve(__dirname,"views"))
app.set("view engine","ejs")

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
	if (data.object === 'page')  {
		data.entry.forEach(function(entry) {
			var pageID = entry.id;
			var timeOfEvent = entry.time;

			entry.messaging.forEach(function(event) {
				dummy.user_id = event.sender.id
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

function placesToVisit(recipientID) {
	var messagedata = {
		'recipient': {
			'id': recipientID
		},
		message: {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "list",
					"top_element_style": "compact",
					"elements": [
					{
						"title": "Qutub Minar",
						"image_url": "https://lh6.googleusercontent.com/proxy/neRlBen9ugUkhn-Wj5pJLfo_1sK9ht4tNTfOKubLxSi73qzgLINyxWd-H74ABXy-lyUz4_pBY7oeAXaOEPDFwMfQjgTOMt3UmHUEOQnXCBta8RD3WpZdRErib-4nV3dLL7uNMuDGH_L8QcUNHuEQlxJ6f-PTUg=w106-h160-k-no",
						"subtitle": "Qutub Minar is a minaret that forms part of the Qutb complex, a UNESCO World Heritage Site in the Mehrauli area of Delhi, India",
						"default_action": {
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/qutub+minar/",
							"webview_height_ratio": "tall"
						},
						"buttons": [
						{
							"title": "Directions",
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/qutub+minar/",
							"webview_height_ratio": "tall"
						}
						]
					},
					{
						"title": "Gurudwara Bangla Sahib",
						"image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Front_view_of_Gurudwara_Bangla_Sahib%2C_Delhi.jpg/280px-Front_view_of_Gurudwara_Bangla_Sahib%2C_Delhi.jpg",
						"subtitle": "Gurudwara Bangla Sahib is one of the most prominent Sikh gurdwara, or Sikh house of worship, in Delhi, India and known for its association with the eighth Sikh Guru, Guru Har Krishan",
						"default_action": {
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/Gurudwara+Bangla+Sahib/",
							"webview_height_ratio": "tall"
						},
						"buttons": [
						{
							"title": "Directions",
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/Gurudwara+Bangla+Sahib/",
							"webview_height_ratio": "tall"
						}
						]
					},
					{
						"title": "Red Fort",
						"image_url": "https://lh6.googleusercontent.com/proxy/CE_mzNKYysmvWFjB_BR6JU8ENMpnhWr4zGtOs_vHk2yc1WBCowDCovdPNF8gSlGZkQU4RLP2l-eDl7mHrYq_jgSkZM4vDBOL7OJKJxYaH9pWQYXlJUUAIyOCbplNdPBTi03j_L-lSjI6viqYG--Ppj_FWVG8Ago=w285-h160-k-no",
						"subtitle": "The Red Fort is a historical fort in Delhi. It was the main residence of the emperors of the Mughal dynasty for nearly 200 years, until 1857.",
						"default_action": {
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/red+fort/",
							"webview_height_ratio": "tall"
						},
						"buttons": [
						{
							"title": "Directions",
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/red+fort/",
							"webview_height_ratio": "tall"
						}
						]
					},
					{
						"title": "Lotus Temple",
						"image_url": "https://lh4.googleusercontent.com/proxy/wO9eGo3c1dMoSpUbI2zf3CyXkJ6y4PKQfpW3J_-p6jbppkvUVDqUGqZIIQojsclHePzEcq4hHINe-qcK0xNVR_O5aJlTxy-qcsmVFKDKD3Fw-eSGbCUnYEp-tOljstICYDOiVC7IjHTyvQBB5QielgU0pxC0bxU=w261-h160-k-no",
						"subtitle": "The Lotus Temple is a Bahá'í House of Worship completed in 1986. Notable for its flowerlike shape, it has become a prominent attraction in the city. ",
						"default_action": {
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/lotus+temple/",
							"webview_height_ratio": "tall"
						},
						"buttons": [
						{
							"title": "Directions",
							"type": "web_url",
							"url": "https://www.google.co.in/maps/dir/my+location/lotus+temple/",
							"webview_height_ratio": "tall"
						}
						]
					}
					],
					"buttons": [
					{
						"title": "View More",
						"type": "web_url",
						"url": "https://www.tripadvisor.in/Attractions-g304551-Activities-New_Delhi_National_Capital_Territory_of_Delhi.html",
					}
					]
				}
			}
		}
	}

	callSendAPI(messagedata)
}

function receivedMessage(event) {
	if("postback" in event) {
		var introText = "Hey! I'm Cody, your friend in the city! \n I'll help you with any information you want, any announcements, complaints or just hang out!"
		sendTextMessage(event.sender.id, "introText")
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
			} else if(event.message.nlp.entities.intent[0].value === "visit") {
				sendTextMessage(event.sender.id, "Here are a few tourist attractions")
				placesToVisit(event.sender.id)
			} else if(event.message.nlp.entities.intent[0].value === "info") {
				console.log("jere")
				info(event.sender.id)
			}
		} else {
			if(complaintState === "intentactive") {
				complaintState = "setlocation"
				dept = event.message.text
				getLocation(event.sender.id)
			} else if(complaintState === "deptchosen") {
				var obj = {
					user_id: event.sender.id,
					department: dept,
					complaint: event.message.text
				}
				complaints.push(obj)
				console.log(complaints)
				//console.log(`Department: ${dept}\nComplaint: ${event.message.text}`)
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
	console.log(req.body)
	var department = req.body.department
	var message = req.body.description
	var password = req.body.password
	if(password === "password") {
		sendTextMessage(dummy.user_id, `${department} issued the following announcement -\n${message}`)
		res.status(200).redirect("/")
	} else {
		res.redirect("/emergency")
	}
})

app.get("/emergency",(req,res)=>{
	res.render("emergency")
})

app.get("/login",(req, res)=>{
	res.render("login")
})
app.post("/login",(req,res)=>{
	if(req.body.password === "password") {
		res.redirect("/profile/"+req.body.username)
	} else {
		res.redirect("/login")
	}
})

app.get('/',(req,res)=>{
	res.send('<h1>Hello World.</h1>')
})
app.listen(port,()=>{
	console.log("live on ",port)
})
