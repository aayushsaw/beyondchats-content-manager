const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const natural = require('natural');

const app = express();
const port = 3001;
const db = new sqlite3.Database('./articles.db');

app.use(cors());
app.use(bodyParser.json());

// AI Functions
function generateSummary(text, maxSentences = 3) {
    if (!text || text.length < 50) return text;

    try {
        // Tokenize into sentences
        const tokenizer = new natural.SentenceTokenizer();
        const sentences = tokenizer.tokenize(text);

        if (sentences.length <= maxSentences) return text;

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
        return text.substring(0, 200) + '...';
    }
}

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

function findRelatedArticles(currentArticle, allArticles, maxRelated = 3) {
    const currentWords = new Set(currentArticle.title.toLowerCase().split(/\s+/).concat(
        currentArticle.content.toLowerCase().split(/\s+/).slice(0, 100) // First 100 words
    ));

    const similarities = allArticles
        .filter(article => article.id !== currentArticle.id)
        .map(article => {
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
                summary: generateSummary(article.content, 2)
            };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxRelated);

    return similarities;
}

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({"message": "Server is working", "timestamp": new Date().toISOString()});
});

// Get all articles
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

// Get single article
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

// Create article
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

// Update article
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

// Delete article
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

// AI-Enhanced Articles Endpoint
app.get('/api/articles/enhanced', (req, res) => {
    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        const enhancedArticles = rows.map(article => ({
            ...article,
            summary: generateSummary(article.content),
            readingTime: estimateReadingTime(article.content),
            category: categorizeContent(article.title, article.content),
            wordCount: article.content.split(/\s+/).length,
            isEnhanced: !!article.updated_content
        }));

        res.json({
            "message":"success",
            "data": enhancedArticles
        });
    });
});

// Enhanced Single Article Endpoint
app.get('/api/articles/:id/enhanced', (req, res) => {
    const sql = "SELECT * FROM articles WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        if (!row) {
            res.status(404).json({"error": "Article not found"});
            return;
        }

        const enhancedArticle = {
            ...row,
            summary: generateSummary(row.content),
            readingTime: estimateReadingTime(row.content),
            category: categorizeContent(row.title, row.content),
            wordCount: row.content.split(/\s+/).length,
            isEnhanced: !!row.updated_content
        };

        res.json({
            "message":"success",
            "data": enhancedArticle
        });
    });
});

// Related Articles Endpoint
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

        // Get all articles for comparison
        db.all("SELECT * FROM articles", [], (err, allArticles) => {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }

            const relatedArticles = findRelatedArticles(currentArticle, allArticles);

            res.json({
                "message":"success",
                "data": relatedArticles
            });
        });
    });
});

// AI-Powered Search Endpoint
app.get('/api/articles/search/ai', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({"error": "Search query is required"});
    }

    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        const searchResults = rows.map(article => {
            const title = article.title.toLowerCase();
            const content = article.content.toLowerCase();
            const searchQuery = query.toLowerCase();

            // Calculate relevance score
            let score = 0;

            // Title matches (higher weight)
            if (title.includes(searchQuery)) {
                score += 10;
                if (title.startsWith(searchQuery)) score += 5;
            }

            // Content matches
            const contentMatches = (content.match(new RegExp(searchQuery, 'g')) || []).length;
            score += contentMatches * 2;

            // Word-level matching for semantic search
            const queryWords = searchQuery.split(/\s+/);
            queryWords.forEach(word => {
                if (title.includes(word)) score += 3;
                if (content.includes(word)) score += 1;
            });

            return {
                ...article,
                score,
                summary: generateSummary(article.content, 2),
                readingTime: estimateReadingTime(article.content),
                category: categorizeContent(article.title, article.content)
            };
        })
        .filter(article => article.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Limit results

        res.json({
            "message":"success",
            "query": query,
            "data": searchResults
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Test endpoint available at http://localhost:' + port + '/api/test');
});