require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel() {
    const modelName = "gemini-2.0-flash";
    console.log(`Testing ${modelName}...`);
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Explain AI in 1 sentence.");
        const response = await result.response;
        console.log("SUCCESS! Response:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }
}

testModel();
