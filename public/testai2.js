
/*
const OpenAI = require('openai');
const colors = require('colors');
const dotenv = require("dotenv");
*/
//import { OpenAI } from './openai';
//import OpenAI from 'openai';

/*
const OpenAI = require('./openai');
const {colors} = require('./colors');
const {dotenv} = require("./dotenv");
/*
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function ask(question) {
  const stream = await openai.beta.chat.completions.stream({
    model: 'gpt-4',
    messages: [{ role: 'user', content: question }],
    stream: true,
  });
	
  var response = await stream.on('content', (delta, snapshot) => {});
  const chatCompletion = await stream.finalChatCompletion();
  console.log(colors.bold.blue(response.messages[0].role + ": " + response.messages[0].content));
  console.log(colors.bold.green(response.messages[1].role + ": " + response.messages[1].content));
}
*/
//ask("What is your name?");


const testai2 = (value) => {
    console.log(value);
    //ask("What is your name?");
}

//module.exports = {testai2}