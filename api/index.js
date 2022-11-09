// import express from 'express'; 
// import dotenv from 'dotenv'; 
// import { Configuration, OpenAIApi } from "openai";

const express = require('express'); 
const dotenv = require('dotenv'); 

dotenv.config(); 

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);


const app = express(); 

app.use(express.urlencoded());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    console.log('POST', req.body.desc); 

    // const img = await openai.createImage({
    //   prompt: req.body.desc,
    //   n: 1,
    //   size: "512x512",
    // });
    // res.status(200).json({ result: img.data.data[0].url }); 
    
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.status(200).json({ result: 'PHLEGMER' }); 
    
}); 

// app.use(express.static('public')); 
// app.listen(3000, () => console.log('Listening on port 3000.'));

export default app; 