const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;
const db = new sqlite3.Database('./articles.db');

app.use(cors());
app.use(bodyParser.json());

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Test endpoint available at http://localhost:' + port + '/api/test');
});