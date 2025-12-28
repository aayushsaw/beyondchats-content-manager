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

// Advanced AI Functions
function analyzeSentiment(text) {
    if (!text) return { score: 0, magnitude: 0, label: 'neutral' };

    try {
        const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(text.toLowerCase());

        const score = analyzer.getSentiment(tokens);
        const magnitude = Math.abs(score);

        let label = 'neutral';
        if (score > 0.1) label = 'positive';
        else if (score < -0.1) label = 'negative';

        return {
            score: Math.round(score * 100) / 100,
            magnitude: Math.round(magnitude * 100) / 100,
            label
        };
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return { score: 0, magnitude: 0, label: 'neutral' };
    }
}

function calculateQualityScore(article) {
    let score = 50; // Base score

    const title = article.title || '';
    const content = article.content || '';
    const wordCount = content.split(/\s+/).length;

    // Title quality (20 points max)
    if (title.length > 10 && title.length < 80) score += 10;
    if (title.includes('?') || title.includes(':')) score += 5;
    if (/[A-Z]/.test(title)) score += 5; // Has proper capitalization

    // Content length (20 points max)
    if (wordCount > 300) score += 10;
    if (wordCount > 600) score += 10;

    // Content quality (30 points max)
    const sentences = content.split(/[.!?]+/).length;
    if (sentences > 5) score += 10;
    if (content.includes('<p>') || content.includes('<h')) score += 10; // Has structure
    if (content.match(/\b\d+\b/g)?.length > 3) score += 5; // Has numbers/stats
    if (content.includes('http') || content.includes('www')) score += 5; // Has links

    // AI enhancement bonus (20 points max)
    if (article.updated_content) score += 15;
    if (article.summary) score += 5;

    return Math.min(100, Math.max(0, score));
}

function extractNamedEntities(text) {
    if (!text) return [];

    try {
        // Simple named entity extraction using pattern matching
        const entities = [];

        // Email pattern
        const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        if (emails) {
            emails.forEach(email => entities.push({ text: email, type: 'EMAIL', confidence: 0.9 }));
        }

        // URL pattern
        const urls = text.match(/\bhttps?:\/\/[^\s<>"']+/gi);
        if (urls) {
            urls.forEach(url => entities.push({ text: url, type: 'URL', confidence: 0.9 }));
        }

        // Phone number pattern (basic)
        const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
        if (phones) {
            phones.forEach(phone => entities.push({ text: phone, type: 'PHONE', confidence: 0.8 }));
        }

        // Date patterns
        const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}|\b\d{1,2}-\d{1,2}-\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4}/gi);
        if (dates) {
            dates.forEach(date => entities.push({ text: date, type: 'DATE', confidence: 0.7 }));
        }

        // Company/Product names (simple heuristic - capitalized words)
        const words = text.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3 && /^[A-Z][a-zA-Z]+$/.test(word) && !['The', 'And', 'For', 'Are', 'But', 'Not', 'You', 'All', 'Can', 'Had', 'Her', 'Was', 'One', 'Our', 'Out', 'Day', 'Get', 'Has', 'Him', 'His', 'How', 'Its', 'May', 'New', 'Now', 'Old', 'See', 'Two', 'Who', 'Boy', 'Did', 'Has', 'Let', 'Put', 'Say', 'She', 'Too', 'Use'].includes(word)) {
                entities.push({ text: word, type: 'ORGANIZATION', confidence: 0.6 });
            }
        });

        // Remove duplicates
        const uniqueEntities = entities.filter((entity, index, self) =>
            index === self.findIndex(e => e.text === entity.text && e.type === entity.type)
        );

        return uniqueEntities.slice(0, 10); // Limit to top 10 entities
    } catch (error) {
        console.error('Error extracting named entities:', error);
        return [];
    }
}

function performTopicModeling(articles, numTopics = 5) {
    try {
        // Simple topic modeling using TF-IDF and clustering
        const tokenizer = new natural.WordTokenizer();
        const stopWords = natural.stopwords;

        // Calculate TF-IDF for all articles
        const tfidf = new natural.TfIdf();

        articles.forEach(article => {
            const content = (article.title + ' ' + article.content).toLowerCase();
            const tokens = tokenizer.tokenize(content).filter(word =>
                !stopWords.includes(word) && word.length > 2
            );
            tfidf.addDocument(tokens);
        });

        // Extract top terms for each document
        const topics = [];
        for (let i = 0; i < Math.min(numTopics, articles.length); i++) {
            const terms = tfidf.listTerms(i).slice(0, 10).map(item => ({
                term: item.term,
                score: Math.round(item.tfidf * 100) / 100
            }));

            topics.push({
                id: i + 1,
                name: terms.slice(0, 3).map(t => t.term).join(' '),
                keywords: terms,
                articles: [articles[i].id] // Simplified - in real implementation would cluster
            });
        }

        return topics;
    } catch (error) {
        console.error('Error performing topic modeling:', error);
        return [];
    }
}

function getPersonalizedRecommendations(userBehavior, allArticles, maxRecommendations = 5) {
    // Simple collaborative filtering based on user behavior
    const { viewedArticles, bookmarkedArticles, searchHistory } = userBehavior;

    if (!viewedArticles.length && !bookmarkedArticles.length) {
        // Return popular articles if no user data
        return allArticles
            .sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))
            .slice(0, maxRecommendations);
    }

    // Calculate user preferences based on viewed/bookmarked articles
    const userPreferences = {};
    const userArticles = [...viewedArticles, ...bookmarkedArticles];

    userArticles.forEach(articleId => {
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
            const category = article.category || 'General';
            userPreferences[category] = (userPreferences[category] || 0) + 1;
        }
    });

    // Find preferred category
    const preferredCategory = Object.keys(userPreferences).reduce((a, b) =>
        userPreferences[a] > userPreferences[b] ? a : b, 'General');

    // Recommend articles from preferred category that user hasn't seen
    const recommendations = allArticles
        .filter(article =>
            (article.category === preferredCategory || !article.category) &&
            !viewedArticles.includes(article.id) &&
            !bookmarkedArticles.includes(article.id)
        )
        .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
        .slice(0, maxRecommendations);

    return recommendations;
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
    console.log('Enhanced articles endpoint called');
    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(400).json({"error":err.message});
            return;
        }

        console.log('Found', rows.length, 'articles in database');

        const enhancedArticles = rows.map(article => {
            const fullContent = article.updated_content || article.content;
            
            // Safely apply AI functions with error handling
            let sentiment = { score: 0, label: 'neutral' };
            let qualityScore = 5;
            let namedEntities = [];
            
            try {
                sentiment = analyzeSentiment(fullContent);
            } catch (error) {
                console.error('Sentiment analysis failed for article', article.id, error.message);
            }
            
            try {
                qualityScore = calculateQualityScore({...article, content: fullContent});
            } catch (error) {
                console.error('Quality scoring failed for article', article.id, error.message);
            }
            
            try {
                namedEntities = extractNamedEntities(fullContent);
            } catch (error) {
                console.error('Named entity extraction failed for article', article.id, error.message);
            }
            
            return {
                ...article,
                summary: generateSummary(fullContent),
                readingTime: estimateReadingTime(fullContent),
                category: categorizeContent(article.title, fullContent),
                wordCount: fullContent.split(/\s+/).length,
                isEnhanced: !!article.updated_content,
                sentiment,
                qualityScore,
                namedEntities
            };
        });

        console.log('Returning', enhancedArticles.length, 'enhanced articles');
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

// Topic Modeling Endpoint
app.get('/api/articles/topics', (req, res) => {
    const numTopics = parseInt(req.query.numTopics) || 5;

    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        const topics = performTopicModeling(rows, numTopics);

        res.json({
            "message":"success",
            "data": topics
        });
    });
});

// Personalized Recommendations Endpoint
app.post('/api/articles/recommendations', (req, res) => {
    const userBehavior = req.body.userBehavior || {
        viewedArticles: [],
        bookmarkedArticles: [],
        searchHistory: []
    };

    const maxRecommendations = parseInt(req.query.limit) || 5;

    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        // Enhance articles with AI metadata for better recommendations
        const enhancedArticles = rows.map(article => ({
            ...article,
            qualityScore: calculateQualityScore(article),
            category: categorizeContent(article.title, article.content)
        }));

        const recommendations = getPersonalizedRecommendations(userBehavior, enhancedArticles, maxRecommendations);

        res.json({
            "message":"success",
            "data": recommendations,
            "userBehavior": userBehavior
        });
    });
});

// Article Analysis Endpoint (detailed analysis for single article)
app.get('/api/articles/:id/analysis', (req, res) => {
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

        const fullContent = row.updated_content || row.content;
        const analysis = {
            sentiment: analyzeSentiment(fullContent),
            qualityScore: calculateQualityScore({...row, content: fullContent}),
            namedEntities: extractNamedEntities(fullContent),
            readability: {
                wordCount: fullContent.split(/\s+/).length,
                sentenceCount: fullContent.split(/[.!?]+/).length,
                avgWordsPerSentence: Math.round(fullContent.split(/\s+/).length / fullContent.split(/[.!?]+/).length * 100) / 100
            },
            metadata: {
                hasLinks: fullContent.includes('http') || fullContent.includes('www'),
                hasNumbers: /\d/.test(fullContent),
                hasStructuredContent: fullContent.includes('<p>') || fullContent.includes('<h'),
                isEnhanced: !!row.updated_content
            }
        };

        res.json({
            "message":"success",
            "data": analysis
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Test endpoint available at http://localhost:' + port + '/api/test');
});