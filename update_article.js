const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const API_URL = 'http://localhost:3000/api/articles';

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLatestArticle() {
    try {
        const response = await axios.get(API_URL);
        const articles = response.data.data;
        // Assuming higher ID is later, or we check published_date
        // Let's sort by id descending
        articles.sort((a, b) => b.id - a.id);
        return articles[0];
    } catch (error) {
        console.error("Error fetching articles:", error.message);
        return null;
    }
}

async function searchGoogle(query) {
    console.log(`Searching Google for: ${query}`);
    const browser = await puppeteer.launch({ headless: "new" }); 
    const page = await browser.newPage();
    
    // Set User Agent to avoid basic bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
        
        // Wait for results
        try {
            await page.waitForSelector('div#search', { timeout: 5000 });
        } catch (e) {}

        const links = await page.evaluate(() => {
            const results = [];
            // Try multiple selectors
            const anchors = document.querySelectorAll('#search a, div.g a, [data-header-feature] a');
            
            for (const a of anchors) {
                if (a.href && a.href.startsWith('http') && !a.href.includes('google') && !a.href.includes('youtube')) {
                   // Avoid duplicates
                   if (!results.includes(a.href)) {
                       results.push(a.href);
                   }
                }
                if (results.length >= 2) break;
            }
            return results;
        });
        
        await browser.close();
        return links;
    } catch (error) {
        console.error("Error searching Google:", error.message);
        await browser.close();
        return [];
    }
}

async function scrapeContent(url) {
    try {
        console.log(`Scraping content from: ${url}`);
        // Puppeteer is safer for scraping than axios (handles JS rendering)
        // But let's reuse axios/cheerio for speed if possible, or use puppeteer if already imported.
        // We already have puppeteer imported, so let's use it for consistency.
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const content = await page.evaluate(() => {
            // Heuristic to find main content
            const article = document.querySelector('article') || document.querySelector('main') || document.body;
            return article.innerText;
        });
        
        await browser.close();
        // Return first 2000 chars to avoid huge payloads
        return content.substring(0, 2000); 
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        return "";
    }
}

async function simulateLLMUpdate(originalContent, refContent1, refContent2) {
    console.log("Calling LLM to update article...");
    // Mocking LLM behavior: just appending a summary of referenced content.
    // In a real scenario, this would call OpenAI/Gemini API.
    
    await delay(2000); // Simulate network latency
    
    const updated = `
    ${originalContent}

    ---
    ### UPDATED INSIGHTS
    (This section was generated based on external references)
    
    Recent discussions on this topic highlight several key points found in other sources:
    1. ${refContent1.substring(0, 100).replace(/\n/g, ' ')}...
    2. ${refContent2.substring(0, 100).replace(/\n/g, ' ')}...
    
    These perspectives suggest a broader impact on the industry.
    `;
    
    return updated;
}

async function updateArticleInDB(id, originalContent, newContent, refs) {
    // Append references
    const finalContent = `
    ${newContent}
    
    ### References
    1. ${refs[0]}
    2. ${refs[1]}
    `;
    
    try {
        await axios.put(`${API_URL}/${id}`, {
            updated_content: finalContent
        });
        console.log(`Article ${id} updated successfully.`);
    } catch (error) {
        console.error("Error updating article:", error.message);
    }
}

async function main() {
    // 1. Fetch latest article
    const article = await getLatestArticle();
    if (!article) {
        console.log("No articles found.");
        return;
    }
    console.log(`Latest Article: ${article.title}`);

    // 2. Search Google
    let links = await searchGoogle(article.title);
    
    // FALLBACK: If Google blocks the scraper (common in headless environments), use mock relevant links
    // to ensure the rest of the "AI Update" workflow can be demonstrated.
    if (links.length < 2) {
        console.log("Google Search blocked or found insufficient links. Using fallback sources for demonstration.");
        links = [
            "https://en.wikipedia.org/wiki/Chatbot",
            "https://www.ibm.com/topics/chatbots" 
        ];
    }
    
    console.log(`Found links: \n1. ${links[0]}\n2. ${links[1]}`);

    // 3. Scrape external content
    const content1 = await scrapeContent(links[0]);
    const content2 = await scrapeContent(links[1]);

    // 4. Update Article (Mock LLM)
    const newContent = await simulateLLMUpdate(article.content, content1, content2);

    // 5. Publish
    await updateArticleInDB(article.id, article.content, newContent, links);
}

main();
