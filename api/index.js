
// IMPORTS

const express = require('express'); 

const dotenv = require('dotenv'); 
dotenv.config(); 

const OpenAIApi = require('openai'); 
const Configuration = OpenAIApi.Configuration; 

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi.OpenAIApi(configuration);

// SERVER

const app = express(); 

app.use(express.urlencoded());
app.use(express.json());
console.log('RUNNING SERVER'); 

app.post('/api/gen', async (req, res) => {

    // console.log('POST', req.body.desc); 

    // PRODUCTION
    
    const img = await openai.createImage({
      prompt: req.body.desc,
      n: 1,
      size: "512x512",
    });
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.status(200).json({ result: img.data.data[0].url }); 
    
    // TESTING
    
    // res.status(200).json({ 
    //   result: 'https://cdn.wikimg.net/en/strategywiki/images/6/6c/Zelda_ALttP_Quarreling_brothers.png', 
    //   query: req.body.desc, 
    // }); 

    // res.status(200).json({ result: 'PHLEGMER' }); 
    
}); 

// app.get('/api/gen', async (req, res) => {
//   console.log('GET')
//   console.log('FROM THE SERVER'); 
//   res.status(200).json({ result: 'https://cdn.wikimg.net/en/strategywiki/images/6/6c/Zelda_ALttP_Quarreling_brothers.png' }); 

// })

module.exports = app; 

// app.listen(3000); 