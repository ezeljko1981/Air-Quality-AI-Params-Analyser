'use strict';
const simpleOauthModule = require('simple-oauth2');
const express = require('express');
const Wreck = require('@hapi/wreck');
const router = express.Router();
const config = require('./config.json');
const OpenAI = require('openai');
const colors = require('colors');
const dotenv = require("dotenv");

dotenv.config();
const openai = new OpenAI({
    apiKey: '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'
});

let accessToken;
var assistant = "";
var question_for_ai = "Who are you?";
var question_for_ai_radon = "Who are you?";
var question_for_ai_pm1 = "Who are you?";
var question_for_ai_pm25 = "Who are you?";
var question_for_ai_voc = "Who are you?";
var question_for_ai_co2 = "Who are you?";
var question_for_ai_humidity = "Who are you?";
var question_for_ai_pressure = "Who are you?";
var question_for_ai_temp = "Who are you?";

const callbackUrl = config.redirectUri;
const oauth2 = simpleOauthModule.create({
    client: {
        id: config.clientId,
        secret: config.clientSecret,
    },
    auth: {
        tokenHost: 'https://accounts.airthings.com',
        tokenPath: 'https://accounts-api.airthings.com/v1/token'
    },
});

// Authorization uri definition
const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: callbackUrl,
    scope: 'read:device:current_values',
});

// Initial page redirecting to Airthings
const tokenConfig = {
    scope: 'read:device:current_values',
};

router.get('/auth', async (req, res) => {
    try {
        const result = await oauth2.clientCredentials.getToken(tokenConfig);
        accessToken = oauth2.accessToken.create(result);
        res.redirect('/');
    } catch (error) {
        console.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed auth');
    }
});

// Callback service parsing the authorization token and asking for the access token
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    const options = {
        code,
        redirect_uri: callbackUrl,
    };

    try {
        const result = await oauth2.authorizationCode.getToken(options);
        accessToken = oauth2.accessToken.create(result);
        res.redirect('/');
    } catch (error) {
        console.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed cb');
    }
});

// Login route redirects to main page if access token exists
router.get('/login', (req, res) => {
    if (accessToken) {
        return res.redirect('/index');
    }
    res.render('login');
});

router.get('/logout', (req, res) => {
    accessToken = null;
    res.render('login');
});

// Main route redirects to login if no access token is present.
router.get('/', (req, res) => {
    if (!accessToken) {
        return res.redirect('/login');
    }
    res.render('index', { data: null });
});

router.get('/devices/:id/latest-samples', async (req, res) => {
    const id = req.params['id'];
    return await getData(`devices/${id}/latest-samples`, res);
});

// Fetches data from Airthings ext-api
const getData = async (param, res) => {
    if (accessToken.expired()) {
        try {
            const params = {
                scope: 'read:device:current_values',
            };

            accessToken = await accessToken.refresh(params);
        } catch (error) {
            console.log("Error refreshing token: ", error.message);
        }
    }

    try {
        const options = {
            headers: { 'Authorization': accessToken.token.access_token }
        };

        const { payload } = await Wreck.get(`https://ext-api.airthings.com/v1/${param}`, options);
        //start - creating question for AI
        let obj = JSON.parse(payload);

        //overall
        question_for_ai = "The following air quality parameters were measured in a closed room: ";
        if (obj.data.co2 >= 800) { question_for_ai += "CO2 is " + obj.data.co2 + "(ppm), "; }
        if (obj.data.humidity >= 25) { question_for_ai += "air humidity is " + obj.data.humidity + "(%), "; }
        if (obj.data.pm1 >= 10) { question_for_ai += "PM1 is " + obj.data.pm1 + "(µg/m^2), "; }
        if (obj.data.pm25 >= 10) { question_for_ai += "PM2.5 is " + obj.data.pm25 + "(µg/m^2), "; }
        if (obj.data.radonShortTermAvg >= 250) { question_for_ai += "radon is " + obj.data.radonShortTermAvg + "(Bq/m^2), "; }
        question_for_ai +="air pressure = " + obj.data.pressure + "(hPa), ";        
        question_for_ai +="temperature = " + obj.data.temp + "(°C), ";     
        question_for_ai += "VOC is " + obj.data.voc + "(ppb)";
        question_for_ai += ". What is the overall air quality?"
        console.log("question_for_ai > " + question_for_ai);
        
        question_for_ai_radon = "The measured radon value in a closed room is " + obj.data.radonShortTermAvg + " (Bq/m^2). Is the radon level safe? Which actions should be done in order to reduce radon level? What are the consequences of the current radon level in this room?"; 
        question_for_ai_pm1 = "The measured PM1 value in a closed room is " + obj.data.pm1 + " (µg/m^2). Is the PM1 level good, acceptable or bad? What are the consequences of this PM1 level? How should be PM1 level reduced?"
        question_for_ai_pm25 = "The measured PM2.5 value in a closed room is " + obj.data.pm25 + " (µg/m^2). Is the PM2.5 level good, acceptable or bad? What are the consequences of this PM2.5 level? How should be PM2.5 level reduced?"
        question_for_ai_voc = "The measured VOC value in a closed room is " + obj.data.voc + " (ppb).Is the VOC level good, fair or bad? What are the consequences of this VOC level? Which measures should be performed in order to reduce VOC?";
        question_for_ai_co2 = "The measured CO2 value in a closed room is " + obj.data.co2 + " (ppm). Is the CO2 level good, fair or bad? Which actions should be performed in order to lower CO2 level? What are the consequences of this CO2 level?";
        question_for_ai_humidity = "The measured air humidity value in a closed room is " + obj.data.humidity + " (%). Is the humidity high, normal or low? Which actions should be taken in order to optimise humidity?";
        question_for_ai_pressure = "The measured air pressure value in a closed room is " + obj.data.pressure + " (hPa).Is the preassure high, normal or low? What are the consequences of this preassure level?";
        question_for_ai_temp = "The measured temperature value in a closed room is " + obj.data.temp + " (°C). Is it cold, fine or too warm in this room? Which actions should be taken in order to optimise temperature in this room? ";

        //end - creating question for AI
        const payloadFormatted = JSON.stringify(JSON.parse(payload), null, 2);
        return res.render('index', { data: payloadFormatted });
    } catch (error) {
        console.error('Error fetching data', error.message);
        return res.status(500).json('Error fetching data');
    }
};

// handling openai section
router.get('/openai', async (req, res) => {
    return await getDataAI(question_for_ai, res);
});

router.get('/radon', async (req, res) => {
    return await getDataAI(question_for_ai_radon, res);
});

router.get('/pm1', async (req, res) => {
    return await getDataAI(question_for_ai_pm1, res);
});

router.get('/pm25', async (req, res) => {
    return await getDataAI(question_for_ai_pm25, res);
});

router.get('/voc', async (req, res) => {
    return await getDataAI(question_for_ai_voc, res);
});

router.get('/co2', async (req, res) => {
    return await getDataAI(question_for_ai_co2, res);
});

router.get('/humidity', async (req, res) => {
    return await getDataAI(question_for_ai_humidity, res);
});

router.get('/pressure', async (req, res) => {
    return await getDataAI(question_for_ai_pressure, res);
});

router.get('/temp', async (req, res) => {
    return await getDataAI(question_for_ai_temp, res);
});


const getDataAI = async (question, res) => {
    const stream = await openai.beta.chat.completions.stream({
        model: 'gpt-4',
        messages: [{ role: 'user', content: question }],
        stream: true,
    });
    var response = await stream.on('content', (delta, snapshot) => { });
    const chatCompletion = await stream.finalChatCompletion();
    let payload = { "data": { "u": response.messages[0].content, "a": response.messages[1].content } };
    const payloadFormatted = JSON.stringify(payload, null, 2);
    return res.render('openai', { data: payloadFormatted });
}

module.exports = router;
