require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    console.log("Checking API Key availability...");
    
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing from .env");
        return;
    }

    /* 
       The SDK doesn't always expose listModels directly in the high-level helper, 
       so we'll try to use the raw fetch to the REST API endpoint to see what's going on.
       URL: https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
    */
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    
    const fs = require('fs');
    try {
        console.log("Fetching model list from Google REST API...");
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            fs.writeFileSync('models_list.txt', "API Error: " + JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            const list = data.models.map(m => ` - ${m.name} (${m.supportedGenerationMethods})`).join('\n');
            fs.writeFileSync('models_list.txt', "Available Models:\n" + list);
            console.log("Logged models to models_list.txt");
        } else {
             fs.writeFileSync('models_list.txt', "Unexpected response: " + JSON.stringify(data));
        }
    } catch (error) {
        fs.writeFileSync('models_list.txt', "Network Error: " + error.message);
    }
}

checkModels();
