const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./articles.db');

// Function to get all article links from the blog index page and pagination
async function getAllArticleLinks() {
    const allArticles = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        try {
            const url = page === 1 ? 'https://beyondchats.com/blogs/' : `https://beyondchats.com/blogs/page/${page}/`;
            console.log(`Fetching blog page ${page}: ${url}`);

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);

            const pageArticles = [];

            // Look for article links - try different selectors
            $('article, .post, .entry').each((index, element) => {
                const $article = $(element);
                const $link = $article.find('a[href*="/blogs/"]').first();
                const href = $link.attr('href');

                if (href &&
                    href.includes('/blogs/') &&
                    !href.includes('/category/') &&
                    !href.includes('/page/') &&
                    !href.includes('/tag/') &&
                    href !== 'https://beyondchats.com/blogs/') {

                    // Convert relative URLs to absolute
                    const fullUrl = href.startsWith('http') ? href : `https://beyondchats.com${href}`;

                    // Try to get the title from heading elements within the article
                    let title = $article.find('h1, h2, h3, .entry-title, .post-title').first().text().trim();

                    // Fallback to link text if no heading found
                    if (!title || title.length < 10) {
                        title = $link.text().trim();
                    }

                    // Skip if title is too short or looks like button text
                    if (!title || title.length < 10 || title.toLowerCase().includes('read') || title.toLowerCase().includes('click') || title.toLowerCase().includes('get started')) {
                        return; // Skip this article
                    }

                    // Try to find date
                    let date = null;
                    const dateText = $article.find('time, .date, .published').attr('datetime') ||
                                   $article.find('time, .date, .published').text().trim();
                    if (dateText) {
                        const parsedDate = new Date(dateText);
                        if (!isNaN(parsedDate.getTime())) {
                            date = parsedDate.toISOString().split('T')[0];
                        }
                    }

                    // Avoid duplicates within this page
                    if (!pageArticles.find(a => a.url === fullUrl) && !allArticles.find(a => a.url === fullUrl)) {
                        pageArticles.push({
                            title: title,
                            url: fullUrl,
                            date: date || new Date().toISOString().split('T')[0]
                        });
                    }
                }
            });

            if (pageArticles.length === 0) {
                hasMorePages = false;
                console.log(`No more articles found on page ${page}`);
            } else {
                allArticles.push(...pageArticles);
                console.log(`Found ${pageArticles.length} articles on page ${page}`);

                // Check if there's a next page
                const nextPageLink = $('.pagination .next, .nav-links .next, a:contains("Next"), a:contains("Older Posts")').first().attr('href');
                hasMorePages = !!nextPageLink && page < 10; // Limit to 10 pages to avoid infinite loops
                page++;
            }

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error.message);
            hasMorePages = false;
        }
    }

    console.log(`Total articles found across all pages: ${allArticles.length}`);
    return allArticles;
}

// Function to scrape article content
async function scrapeArticle(article) {
    try {
        console.log(`Fetching: ${article.url}`);
        const response = await axios.get(article.url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);

        // Try to find the content container
        let content = $('.ct-entry-content').html() ||
                     $('.entry-content').html() ||
                     $('article').html() ||
                     $('.post-content').html();

        if (!content) {
            console.warn(`Could not find content for ${article.title}`);
            content = "";
        }

        return {
            ...article,
            content: content
        };

    } catch (error) {
        console.error(`Error fetching ${article.url}:`, error.message);
        return null;
    }
}

// Main function to scrape all articles
async function scrapeAllArticles() {
    // Initialize database
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

    // Get all article links
    const articleLinks = await getAllArticleLinks();

    if (articleLinks.length === 0) {
        console.log('No articles found to scrape');
        return;
    }

    console.log(`Starting to scrape ${articleLinks.length} articles...`);

    // Scrape each article
    for (const article of articleLinks) {
        const scrapedArticle = await scrapeArticle(article);

        if (scrapedArticle) {
            db.run(`INSERT OR REPLACE INTO articles (title, url, content, published_date) VALUES (?, ?, ?, ?)`,
                [scrapedArticle.title, scrapedArticle.url, scrapedArticle.content, scrapedArticle.date],
                function(err) {
                    if (err) {
                        console.error('Database error:', err.message);
                    } else {
                        console.log(`Inserted article id ${this.lastID}: ${scrapedArticle.title}`);
                    }
                }
            );
        }

        // Add delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Scraping completed!');
    db.close();
}

// Run the scraper
scrapeAllArticles().catch(console.error);