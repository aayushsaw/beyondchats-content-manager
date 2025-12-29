// using global fetch in Node 18+

async function testEndpoints() {
    console.log("Testing /api/articles/enhanced...");
    try {
        const start = Date.now();
        const res = await fetch('http://localhost:3002/api/articles/enhanced');
        const data = await res.json();
        const duration = (Date.now() - start) / 1000;
        
        console.log(`Duration: ${duration}s`);
        if (data.data && data.data.length > 0) {
            const article = data.data[0];
            console.log("First Article AI Data:");
            console.log("Sentiment:", article.sentiment);
            console.log("Quality:", article.qualityScore);
            console.log("Entities:", article.namedEntities);
            console.log("Summary:", article.summary?.substring(0, 50) + "...");
        } else {
            console.log("No data returned or error:", data);
        }
    } catch (e) {
        console.error("Error fetching enhanced:", e);
    }
}

testEndpoints();
