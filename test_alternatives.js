require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAlternatives() {
    const models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const name of models) {
        console.log(`\nTesting ${name}...`);
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Hi");
            console.log(`✅ ${name}: SUCCESS`);
        } catch (error) {
            console.log(`❌ ${name}: ${error.toString()}`); // Print full error
        }
    }
}

testAlternatives();
