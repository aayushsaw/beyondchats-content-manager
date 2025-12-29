const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./articles.db');

const searchTerm = '%Choosing the right AI chatbot%';

db.serialize(() => {
    // First find the articles
    db.all("SELECT id, title, content FROM articles WHERE title LIKE ? OR content LIKE ?", [searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        
        if (rows.length > 0) {
            console.log(`Found ${rows.length} articles matching search.`);
            rows.forEach(row => {
                console.log(`ID: ${row.id}`);
                console.log(`Title: ${row.title}`);
                console.log(`Content Snippet: ${row.content.substring(0, 100)}`);
                
                // Delete the article
                db.run("DELETE FROM articles WHERE id = ?", row.id, (err) => {
                    if (err) console.error("Error deleting:", err);
                    else console.log(`Deleted article ID ${row.id}`);
                });
            });
        } else {
            console.log("No articles found matching the search term.");
        }
    });
});
