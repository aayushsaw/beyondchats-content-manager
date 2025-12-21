const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./articles.db');

const articles = [
    {
        title: "Chatbots Magic: Beginner’s Guidebook",
        url: "https://beyondchats.com/blogs/introduction-to-chatbots/",
        date: "2023-12-05"
    },
    {
        title: "7 ways a Live Chatbot transforms customer interaction",
        url: "https://beyondchats.com/blogs/live-chatbot/",
        date: "2023-12-06"
    },
    {
        title: "7 Clear Indicators Your Business Needs a Virtual Assistant",
        url: "https://beyondchats.com/blogs/virtual-assistant/",
        date: "2023-12-07"
    },
    {
        title: "10X Your Leads: How Chatbots Revolutionize Lead Generation",
        url: "https://beyondchats.com/blogs/lead-generation-chatbots/",
        date: "2023-12-08"
    },
    {
        title: "Can Chatbots Boost Small Business Growth?",
        url: "https://beyondchats.com/blogs/chatbots-for-small-business-growth/",
        date: "2023-12-08"
    }
];

// Initialize DB
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        url TEXT,
        content TEXT,
        published_date TEXT,
        updated_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

async function scrapeAndStore() {
    for (const article of articles) {
        try {
            console.log(`Fetching: ${article.url}`);
            const response = await axios.get(article.url);
            const $ = cheerio.load(response.data);
            
            // Try to find the content container. 
            // Based on typical WordPress/Elementor sites causing the selectors seen in subagent:
            // .ct-entry-content, .entry-content, or .elementor-widget-theme-post-content
            let content = $('.ct-entry-content').html() || $('.entry-content').html() || $('article').html();
            
            // Clean up content slightly (optional, but good for storage)
            if (content) {
                // simple cleanup: remove scripts/styles if any are inside (cheerio usually handles just text if used .text(), but we want HTML structure potentially?)
                // task says "Scrape articles... Store... in database". HTML is usually better for re-displaying.
                // But for "searches... updates original article", text might be needed for LLM. 
                // Let's store HTML.
            } else {
                console.warn(`Could not find content for ${article.title}`);
                content = "";
            }

            db.run(`INSERT INTO articles (title, url, content, published_date) VALUES (?, ?, ?, ?)`, 
                [article.title, article.url, content, article.date], 
                function(err) {
                    if (err) {
                        return console.error(err.message);
                    }
                    console.log(`Inserted article id ${this.lastID}`);
                }
            );

        } catch (error) {
            console.error(`Error fetching ${article.url}:`, error.message);
        }
    }
}

scrapeAndStore();
