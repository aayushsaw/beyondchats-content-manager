require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    console.log("Checking available models...");
    try {
        // Access the API key
        if (!process.env.GEMINI_API_KEY) {
            console.error("Error: GEMINI_API_KEY is missing in .env");
            return;
        }

        /* 
           There isn't a direct "listModels" method exposed on the main class in all versions, 
           but we can try to hit the Rest API directly or just test standard models.
           Let's test the standard ones.
        */
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
        
        for (const modelName of models) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                console.log("SUCCESS ✅");
            } catch (err) {
                console.log(`FAILED ❌ (${err.status || err.message})`);
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
