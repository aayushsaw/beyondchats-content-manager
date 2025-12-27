const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./articles.db');

const articles = [
    {
        title: "Which chatbot is right for your business: Intercom vs BeyondChats",
        url: "https://beyondchats.com/blogs/beyondchats-vs-intercom-comparison/",
        date: "2025-02-26"
    },
    {
        title: "Google Ads: Are you wasting your money on clicks?",
        url: "https://beyondchats.com/blogs/google-ads-are-you-wasting-your-money-on-clicks/",
        date: "2024-04-09"
    },
    {
        title: "Will AI Understand the Complexities of Patient Care?",
        url: "https://beyondchats.com/blogs/will-ai-understand-the-complexities-of-patient-care/",
        date: "2024-04-02"
    },
    {
        title: "Should you trust AI in healthcare?",
        url: "https://beyondchats.com/blogs/should-you-trust-ai-in-healthcare/",
        date: "2024-04-08"
    },
    {
        title: "Use these ChatGPT prompt techniques to be more effective",
        url: "https://beyondchats.com/blogs/chatgpt-prompt-techniques-to-be-more-effective/",
        date: "2024-03-17"
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
