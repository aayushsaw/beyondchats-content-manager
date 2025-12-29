const fetch = require('node-fetch');

async function testFallback() {
    console.log("Sending chat request...");
    try {
        // ID 1 should exist (based on previous browser test having articles)
        const response = await fetch('http://localhost:3002/api/articles/1/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Hello testing fallback" })
        });
        
        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", data);
        
        if (response.status === 200 && data.reply) {
            console.log("✅ Chat successful (Fallback worked!)");
        } else {
            console.log("❌ Chat failed");
        }
    } catch (error) {
        console.error("Request error:", error);
    }
}

testFallback();
