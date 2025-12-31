require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3002;
const db = new sqlite3.Database('./articles.db');

// Initialize AI Clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// List of models to try in order of preference
const GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-pro"
];

// Helper to generate content with fallback strategies
async function generateWithFallback(prompt) {
    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
        console.log(`🤖 [Gemini] Attempting with model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // Internal retry loop for transient errors (like 429) on the *same* model
            // before giving up and switching to the next model.
            return await generateWithRetryForModel(model, prompt);
        } catch (error) {
            console.error(`❌ [Gemini] Model ${modelName} failed:`, error.message);
            lastError = error;
            // Should verify if we should continue (e.g. Rate Limit might be global?)
            // But usually different models have different quotas/availabilities.
            continue;
        }
    }
    
    // Final Attempt with OpenAI (Guaranteed Response Policy)
    if (process.env.OPENAI_API_KEY) {
        console.log(`🤖 [OpenAI] Attempting final fallback with ChatGPT...`);
        try {
            return await generateWithOpenAI(prompt);
        } catch (error) {
            console.error(`❌ [OpenAI] ChatGPT failed:`, error.message);
            lastError = error;
        }
    }

    throw new Error(`All AI models (Gemini & OpenAI) failed. Last error: ${lastError?.message}`);
}

// OpenAI specific helper
async function generateWithOpenAI(prompt) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective and reliable fallback
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
    });
    return response.choices[0].message.content;
}

// Single model retry logic (handling 429s/Transient errors)
async function generateWithRetryForModel(model, prompt, retries = 2, delay = 2000) {
    for (let i = 0; i <= retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            const isRateLimit = error.status === 429 || error.message.includes("429");
            if (isRateLimit && i < retries) {
                console.log(`⚠️ [Gemini] Rate limit hit. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                if (i === retries) throw error; // Throw to trigger fallback to next model
                
                // For non-rate-limit 5xx errors, also maybe retry? 
                // For now, only hard retry on 429, fail fast on others to switch model.
                if (!isRateLimit) throw error; 
            }
        }
    }
}

// Initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                url TEXT,
                content TEXT,
                published_date TEXT,
                updated_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    reject(err);
                    return;
                }
                
                // Check if table is empty and insert sample data
                db.get("SELECT COUNT(*) as count FROM articles", [], (err, row) => {
                    if (err) {
                        console.error('Error checking table:', err);
                        reject(err);
                        return;
                    }
                    
                    if (row.count === 0) {
                        console.log('Database is empty, inserting sample data...');
                        const sampleArticles = [
                            {
                                title: 'The Future of AI in Healthcare',
                                url: 'https://beyondchats.com/blogs/ai-healthcare',
                                content: '<p>Artificial intelligence is revolutionizing healthcare by providing doctors with powerful tools for diagnosis and treatment. Machine learning algorithms can analyze medical images, predict patient outcomes, and even assist in drug discovery.</p>',
                                published_date: '2025-12-28'
                            },
                            {
                                title: 'Building Better Chatbots with Machine Learning',
                                url: 'https://beyondchats.com/blogs/chatbots-ml',
                                content: '<p>Modern chatbots powered by machine learning can understand context, maintain conversations, and provide personalized responses. This article explores the latest techniques in conversational AI.</p>',
                                published_date: '2025-12-27'
                            },
                            {
                                title: 'Google Ads Optimization Strategies',
                                url: 'https://beyondchats.com/blogs/google-ads',
                                content: '<p>Effective Google Ads campaigns require continuous optimization. Learn about A/B testing, keyword research, and performance monitoring to maximize your ROI.</p>',
                                published_date: '2025-12-26'
                            }
                        ];
                        
                        const stmt = db.prepare("INSERT INTO articles (title, url, content, published_date) VALUES (?, ?, ?, ?)");
                        let completed = 0;
                        
                        sampleArticles.forEach(article => {
                            stmt.run(article.title, article.url, article.content, article.published_date, (err) => {
                                if (err) {
                                    console.error('Error inserting sample data:', err);
                                }
                                completed++;
                                if (completed === sampleArticles.length) {
                                    stmt.finalize();
                                    console.log('Sample data inserted successfully');
                                    resolve();
                                }
                            });
                        });
                    } else {
                        console.log('Database already has', row.count, 'articles');
                        resolve();
                    }
                });
            });
        });
    });
}

app.use(cors({
  origin: ['https://beyondchats-backend-p8s9.onrender.com', 'https://beyondchats-content-manager.vercel.app', 'https://beyondchats-content-manager-git-main-aayush-saws-projects.vercel.app', 'https://beyondchats-content-manager-9ax5jlbos-aayush-saws-projects.vercel.app', 'https://your-frontend-domain.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(bodyParser.json());

// AI Functions
const cheerio = require('cheerio');

async function generateSummary(htmlContent, maxSentences = 3) {
    if (!htmlContent) return '';
    
    // Strip HTML tags to get plain text first
    let text = htmlContent;
    try {
        const $ = cheerio.load(htmlContent);
        text = $.text().replace(/\s+/g, ' ').trim();
    } catch (e) {
        text = htmlContent.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    }

    if (text.length < 50) return text;

    // Try Gemini API first
    try {
        if (process.env.GEMINI_API_KEY) {
            const prompt = `Summarize the following article in about ${maxSentences} sentences. Focus on key insights for a business reader. Keep it concise/insightful. \n\nArticle: ${text.substring(0, 5000)}`;
            const summary = await generateWithFallback(prompt);
            if (summary) return summary;
        }
    } catch (error) {
        console.error('Gemini API Error (falling back to extraction):', error.message);
    }

    // Fallback: Simplistic Extraction
    try {
        // Tokenize into sentences
        const tokenizer = new natural.SentenceTokenizer();
        const sentences = tokenizer.tokenize(text);

        if (sentences.length <= maxSentences) return text.substring(0, 300) + '...';

        // Calculate word frequency
        const tokenizer2 = new natural.WordTokenizer();
        const words = tokenizer2.tokenize(text.toLowerCase());
        const stopWords = natural.stopwords;
        const wordFreq = {};

        words.forEach(word => {
            if (!stopWords.includes(word) && word.length > 2) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        // Score sentences based on word frequency
        const sentenceScores = sentences.map((sentence, index) => {
            const sentenceWords = tokenizer2.tokenize(sentence.toLowerCase());
            let score = 0;
            sentenceWords.forEach(word => {
                if (wordFreq[word]) {
                    score += wordFreq[word];
                }
            });
            return { sentence, score, index };
        });

        // Sort by score and select top sentences
        sentenceScores.sort((a, b) => b.score - a.score);
        const topSentences = sentenceScores.slice(0, maxSentences);
        topSentences.sort((a, b) => a.index - b.index);

        return topSentences.map(item => item.sentence).join(' ');
    } catch (error) {
        console.error('Error generating summary:', error);
        return htmlContent.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...';
    }
}

// Helpers
function estimateReadingTime(text) {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes);
}

function categorizeContent(title, content) {
    const categories = {
        'AI & Technology': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'automation', 'robotics', 'computer vision', 'nlp', 'natural language', 'chatbot', 'algorithm', 'data science', 'blockchain', 'cryptocurrency', 'quantum', 'cybersecurity'],
        'Healthcare': ['healthcare', 'medical', 'health', 'patient', 'doctor', 'hospital', 'treatment', 'diagnosis', 'pharmaceutical', 'biotech', 'clinical', 'therapy', 'vaccine', 'pandemic'],
        'Business & Marketing': ['business', 'marketing', 'startup', 'entrepreneur', 'revenue', 'profit', 'growth', 'strategy', 'customer', 'market', 'sales', 'advertising', 'brand', 'commerce', 'ecommerce'],
        'Web Development': ['javascript', 'react', 'node', 'frontend', 'backend', 'api', 'database', 'web', 'html', 'css', 'framework', 'server', 'deployment', 'cloud', 'aws', 'docker'],
        'General': ['productivity', 'life', 'tips', 'guide', 'tutorial', 'how-to', 'best practices', 'trends', 'future', 'innovation']
    };

    const text = (title + ' ' + content).toLowerCase();
    const matches = {};

    Object.keys(categories).forEach(category => {
        let count = 0;
        categories[category].forEach(keyword => {
            if (text.includes(keyword)) count++;
        });
        if (count >= 2) { // Require at least 2 keyword matches
            matches[category] = count;
        }
    });

    // Return category with highest matches, or 'General' if none
    const bestMatch = Object.keys(matches).reduce((a, b) =>
        matches[a] > matches[b] ? a : b, 'General');

    return bestMatch;
}

async function findRelatedArticles(currentArticle, allArticles, maxRelated = 3) {
    const currentWords = new Set(currentArticle.title.toLowerCase().split(/\s+/).concat(
        currentArticle.content.toLowerCase().split(/\s+/).slice(0, 100)
    ));

    const comparisons = allArticles
        .filter(article => article.id !== currentArticle.id)
        .map(async article => {
            const articleWords = new Set(article.title.toLowerCase().split(/\s+/).concat(
                article.content.toLowerCase().split(/\s+/).slice(0, 100)
            ));

            // Jaccard similarity
            const intersection = new Set([...currentWords].filter(x => articleWords.has(x)));
            const union = new Set([...currentWords, ...articleWords]);
            const similarity = intersection.size / union.size;

            return {
                ...article,
                similarity,
                summary: await generateSummary(article.content, 2)
            };
        });

    const results = await Promise.all(comparisons);
        
    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxRelated);
}


// Advanced AI Functions with Gemini
async function analyzeArticleWithGemini(content) {
    if (!content) return null;
    
    // Clean content
    let text = content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    if (text.length > 10000) text = text.substring(0, 10000); // Token limit protection

    const prompt = `
    Analyze the following article text and return valid JSON with these fields:
    - summary: A cohesive, interesting 2-sentence summary.
    - sentiment: Object with { score: number (-1 to 1), label: string (e.g. "Optimistic", "Critical"), magnitude: number (0-1) }.
    - qualityScore: number (0-100) based on depth, readability, and uniqueness.
    - namedEntities: Array of objects { text: string, type: string } for top 3-5 key concepts, tech, or companies.
    
    Article Text:
    "${text}"
    `;

    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("No API Key");
        const jsonStr = await generateWithFallback(prompt);
        return JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error) {
        console.error("Gemini Analysis Error Full Stack:", error);
        // Fallback or partial return
        return {
            summary: await generateSummary(content),
            sentiment: { score: 0, label: 'Neutral', magnitude: 0 },
            qualityScore: 70,
            namedEntities: []
        };
    }
}

// Routes
app.get('/api/test', (req, res) => {
    res.json({"message": "Server is working - updated", "timestamp": new Date().toISOString()});
});

app.get('/api/test-db', (req, res) => {
    db.get("SELECT COUNT(*) as count FROM articles", [], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({"message": "Database working", "articleCount": row.count});
    });
});

app.get('/api/articles', (req, res) => {
    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

app.get('/api/articles/enhanced', (req, res) => {
    // Limit to 10 for API testing to avoid rate limits initially
    db.all("SELECT * FROM articles ORDER BY published_date DESC LIMIT 10", [], async (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        
        const enhancedArticlesPromises = rows.map(async article => {
            const contentToAnalyze = article.updated_content || article.content || '';
            const aiData = await analyzeArticleWithGemini(contentToAnalyze);
            
            return {
                ...article,
                ...aiData,
                readingTime: Math.max(1, Math.ceil(contentToAnalyze.split(/\s+/).length / 200)),
                category: categorizeContent(article.title, contentToAnalyze), // Keep local categorization for now
            };
        });

        const enhancedArticles = await Promise.all(enhancedArticlesPromises);
        res.json({ "message":"success", "data": enhancedArticles });
    });
});

app.get('/api/articles/:id', (req, res) => {
    const sql = "SELECT * FROM articles WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":row
        })
    });
});

app.post('/api/articles', (req, res) => {
    const data = {
        title: req.body.title,
        url: req.body.url,
        content: req.body.content,
        published_date: req.body.published_date
    }
    const sql ='INSERT INTO articles (title, url, content, published_date) VALUES (?,?,?,?)';
    const params =[data.title, data.url, data.content, data.published_date];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
});

app.put('/api/articles/:id', (req, res) => {
    const data = {
        title: req.body.title,
        url: req.body.url,
        content: req.body.content,
        published_date: req.body.published_date,
        updated_content: req.body.updated_content
    }
    db.run(
        `UPDATE articles set
           title = COALESCE(?,title),
           url = COALESCE(?,url),
           content = COALESCE(?,content),
           published_date = COALESCE(?,published_date),
           updated_content = COALESCE(?,updated_content)
           WHERE id = ?`,
        [data.title, data.url, data.content, data.published_date, data.updated_content, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({
                message: "success",
                changes: this.changes
            })
    });
});

app.delete('/api/articles/:id', (req, res) => {
    db.run(
        'DELETE FROM articles WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
});

app.get('/api/articles/:id/related', (req, res) => {
    const sql = "SELECT * FROM articles WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, currentArticle) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        if (!currentArticle) {
            res.status(404).json({"error": "Article not found"});
            return;
        }
        db.all("SELECT * FROM articles", [], async (err, allArticles) => {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            // Use lighter check for related articles to save API calls
            const relatedArticles = await findRelatedArticles(currentArticle, allArticles);
            res.json({ "message":"success", "data": relatedArticles });
        });
    });
});

// Chat with Article Endpoint
app.post('/api/articles/:id/chat', (req, res) => {
    const { message, history } = req.body;
    const articleId = req.params.id;

    db.get("SELECT content, updated_content FROM articles WHERE id = ?", [articleId], async (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Article not found" });

        const articleText = (row.updated_content || row.content).replace(/<[^>]*>?/gm, '').substring(0, 15000);
        
        const chatPrompt = `
        You are a helpful AI assistant. Answer the user's question based ONLY on the context of the article provided below.
        
        Article Content:
        "${articleText}"

        Chat History:
        ${JSON.stringify(history || [])}

        User Question: "${message}"
        
        Answer (concise):
        `;

        try {
            const reply = await generateWithFallback(chatPrompt);
            res.json({ reply });
        } catch (error) {
            console.error("Chat Error:", error);
            res.status(500).json({ error: "Failed to generate chat response: " + error.message });
        }
    });
});

app.get('/api/articles/:id/analysis', (req, res) => {
    res.json({ message: "Deprecated. Use enhanced endpoint." }); // Simplified for now
});

// Initialize database before starting server
initializeDatabase().then(() => {
    console.log('Database initialized successfully');
    
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
        console.log(`Test endpoint available at http://localhost:${port}/api/test`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});