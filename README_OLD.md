# System Setup

## Note on Architecture
Due to the absence of PHP and Composer in the current environment, the **Laravel** requirement for Phase 1 was replaced with a **Node.js/Express** backend. This ensures the entire full-stack application (Backend + Script + Frontend) works seamlessly in the available Node.js environment.

## Prerequisites
- Node.js (Installed: v22.14.0)
- NPM

## Project Structure
- `server.js`: Express API backend (Port 3000). Replaces Laravel.
- `articles.db`: SQLite database storing scraped articles.
- `scrape_and_store.js`: Initial setup script that scrapes BeyondChats and populates the DB.
- `update_article.js`: Phase 2 script that fetches the latest article, searches Google, scrapes references, mocks an LLM update, and saves it.
- `frontend/`: React + Vite application (Port 5173).

## Instructions

### 1. Initialize
The dependencies should already be installed. If not:
```bash
npm install
cd frontend
npm install
cd ..
```

### 2. Run Backend
Start the API server:
```bash
node server.js
```
*Keep this terminal open.*

### 3. Run Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
Access the app at `http://localhost:5173`.

### 4. Run Phase 2 Script
To perform the "Search & Update" task:
```bash
node update_article.js
```
This will:
- Read the latest article from the API.
- Use Puppeteer to search Google.
- Scrape 2 external articles.
- Update the article in the database with new content and references.
- You can refresh the Frontend to see the "AI Updated" badge appear on the latest article.

## Notes
- The "LLM" part in `update_article.js` is simulated with a mock function to ensure it runs without an API key. You can find the `simulateLLMUpdate` function in the file to connect a real API.
- The Google Search uses `puppeteer` to scrape results. **Note**: Google often blocks automated scrapers (CAPTCHA/429). If the script reports "Could not find enough links", it encounters this protection. In a production environment, use a paid SERP API (like SerpApi or Google Custom Search JSON API).
