const
express = require('express')
request = require('request')
axios = require('axios')
bodyParser = require('body-parser')
path = require('path')
port = 3000
config = require('./config/secret')
fs = require('fs')

const app = express()

var complaintState = "inactive"
var translateState = "inactive"
var fromLan = "English"
var toLan = "English"
var text = "How are you?"
var dept = "NULL"
var tips = ['Make the most of our modern Metro. You will be hardpressed to find a destination whose journey won\'t be aided through it.',
			'Be careful of what you eat. While street food can be enticing and delicous, you wouldn\'t want to catch a case of the Delhi Belly',
			'Dress appropriately. Some of our main attractions have religuous foundations. Kindly respect such establishments',
			'At night, prefer travelling in groups rather than solo. Always be cognizant of your surroundings']
var complaints = []
var ticketid = 1

fs.readFile('ledger.json', function(err,data) {
	complaints = JSON.parse(data)
})

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
	var introText = "Hey! I'm Cody\n I'm here to help you get about the city.\n What can I do? Glad you asked!"
	var features = "Ask for places to visit, make a complaint, get notified of events happening around you and much more! Bow wow!"
	sendTextMessage(recipientID, introText)
	sendTextMessage(recipientID, features)
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

function giveTips(recipientID) {
	var use = tips.slice(0, 2)
	tips = tips.slice(2, 4)
	tips = tips.concat(use)
	sendTextMessage(recipientID, use[0])
	sendTextMessage(recipientID, use[1])
}

function getLocation(recipientID) {
	var messageData = {
		'recipient': {
			'id': recipientID
		},
		"message": {
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

function decode(s) {
	return decodeURIComponent(escape(s))
}
function Translate(recipientID){



	var sym={
		'English':'en',
		'Hindi':'hi',
		'Russian':'ru',
		'Spanish':'es',
		'French':'fr',
	
	}
	var messageData = {
		'recipient': {
			'id': recipientID
		},
		"message": {
			"text": "Some error occurred ?",
		}
	}

	
	var url='https://translate.yandex.net/api/v1.5/tr.json/translate?'
	var KEY='trnsl.1.1.20170902T200819Z.cb2c5c381d54ef25.22e2e62b652fd891761b819e8aefcfdaf99374b5'
	var format='plain'
	var lang=sym[fromLan]+'-'+sym[toLan];
	var param={'lang':lang,'key':KEY,'text':text,'format':format}
	var request = require('request');
	var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
	}

	var options = {
    url: url,
    method: 'POST',
    headers: headers,
    qs: param,
}
	var ret='Some error occurred.Sorry !'
	var done=false
	request(options, function (error, response, body) {
	console.log(body)
    if (!error && response.statusCode == 200) {
    	dic=JSON.parse(body)
    	text=dic['text'][0]
    	//text=decode_utf8(text)
    	console.log('yeh hai translated'+text)
    	//ret=decode(text)
    	ret = text
    	console.log(typeof(text))
    	messageData["message"]['text']=ret
    	callSendAPI(messageData)

    }
    else
    {
    	callSendAPI(messageData)
    }
})	
}

function DelhiInfo(recipientID, more = 0) {
	var links = ["Check these out", "What do you wanna know?", 
	"How about these?", ":)", "Hope this helps!"];
	if(more === 1) {
		links = ["Still curious?", "Sure!", "Glad to help"];
	}
	var randIdx = Math.random() * links.length;
	randIdx = parseInt(randIdx, 10);
	var link = links[randIdx];
	
	var messageData = {
		'recipient': {
			'id': recipientID
		},
		message: {
			"text": link,
			"quick_replies": [
			{
				"content_type": "text",
				"title": "Tips please",
				"payload": "WATER_DIVISION"
			},
			{
				"content_type": "text",
				"title": "Places to visit",
				"payload": "ELECTRICITY_DIVISION"
			},
			{
				"content_type": "text",
				"title": "Fun fact",
				"payload": "MEDICAL_DIVISION"
			},
			{
				"content_type": "text",
				"title": "Places to eat",
				"payload": "MEDICAL_DIVISION"
			},
			{
				"content_type": "text",
				"title": "Weather",
				"payload": "POLICE_DIVISION"
			}
			]
		}
	}
	callSendAPI(messageData)
}

function haveFun(recipientID) {
	var links = ["https://imgur.com/2YahJvd", "https://imgur.com/0DIWcuN", 
	"https://imgur.com/2DPrBJq", "https://imgur.com/azjB8WC", "https://imgur.com/YsgDp8n", "https://imgur.com/gqDrgFM",
	"https://imgur.com/LmdOHsl⁠⁠⁠⁠"];
	var randIdx = Math.random() * links.length;
	randIdx = parseInt(randIdx, 10);
	var link = links[randIdx] + '.png';
	console.log(link)
	var messageData = {
		"recipient":{
			"id": recipientID
		},
		"message":{
			"attachment":{
				"type":"image",
				"payload":{
					"url":link
				}
			}
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
			} else if(event.message.nlp.entities.intent[0].value === "tips") {
				giveTips(event.sender.id)
			} else if(event.message.nlp.entities.intent[0].value === "sos") {
				sendTextMessage(event.sender.id, "Emergency numbers : \nPolice : 5551115555\nFire : 5552225555\nAmbulance : 5553335555")
			} else if(event.message.nlp.entities.intent[0].value === "visit") {
				sendTextMessage(event.sender.id, "Here are a few tourist attractions")
				placesToVisit(event.sender.id)
			} else if(event.message.nlp.entities.intent[0].value === "Info") {
				DelhiInfo(event.sender.id)
			} else if(event.message.nlp.entities.intent[0].value === "fun") {
				haveFun(event.sender.id)
			} else if(event.message.nlp.entities.intent[0].value === "curious") {
				DelhiInfo(event.sender.id, 1)
			} else if(event.message.nlp.entities.intent[0].value === "translate") {
				translateState = "gotfrom"
				sendTextMessage(event.sender.id, "What language do you want to translate from?")
			} 
		} else {
			if(complaintState === "intentactive") {
				complaintState = "setlocation"
				dept = event.message.text
				getLocation(event.sender.id)
			} else if(complaintState === "deptchosen") {
				console.log("here")
				var obj = {
					user_id: event.sender.id,
					department: dept,
					complaint: event.message.text,
					ticket_id: ticketid
				}
				ticketid = ticketid + 1
				fs.readFile('ledger.json',function(err,data){
					complaints.push(obj);
					fs.writeFile('ledger.json',JSON.stringify(complaints))
				})	
				sendTextMessage(event.sender.id, `Sending your ticket to ${dept} Division. We'll get back to you soon!`)
				complaintState = "inactive"
				dept = "NULL"
			
			} else if(translateState === "gotfrom"){
				fromLan = event.message.text
				translateState = "gotto"
				sendTextMessage(event.sender.id,"What language do you want to translate to?")
			} else if(translateState === "gotto"){
				toLan = event.message.text
				translateState = "gottext"
				sendTextMessage(event.sender.id,"Say something..")
			} else if(translateState === "gottext") {
				text = event.message.text
				translateState = "inactive"
				Translate(event.sender.id)
			} else {
				sendTextMessage(event.sender.id, "Pardon")
				complaintState = "inactive"
				translateState = "inactive"
			}
		} 
	} else if (complaintState === "setlocation") {
		complaintState = "deptchosen"
		sendTextMessage(event.sender.id, `Write your complaint for the ${dept} Division and you'll be contacted`)
	} else {
		console.log("*")
		sendTextMessage(event.sender.id, "Pardon?")
	}
}

app.post("/emergency",(req, res)=>{
	console.log(req.body)
	var department = req.body.department
	var message = req.body.description
	var password = req.body.password
	if(password === "password") {
		sendTextMessage(dummy.user_id, `${department} issued the following announcement -\n${message}`)
		res.status(200).redirect("/login")
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
		res.redirect("/profile/"+req.body.name)
	} else {
		res.redirect("/login")
	}
})

app.get("/profile/:name",(req,res)=>{
	var name = req.params.name
	name = name.split("%20").join(" ")
	var deptComplaint = []
	complaints.forEach(complaint => {
		if(complaint.department === name) {
			deptComplaint.push(complaint)
		}
	})
	var obj = {
		department: name,
		complaints: deptComplaint
	}
	console.log(JSON.stringify(obj))
	res.render("profile",{data: obj})
})

app.get('/',(req,res)=>{
	res.send('<h1>Hello World.</h1>')
})
app.listen(port,()=>{
	console.log("live on ",port)
})
