# BeyondChats AI Content Manager

## 🌐 Live Deployment
*   **Frontend (Vercel)**: [https://beyondchats-content-manager.vercel.app/](https://beyondchats-content-manager.vercel.app/)
*   **Backend API (Render)**: [https://beyondchats-api.onrender.com/api/articles](https://beyondchats-api.onrender.com/api/articles)

A full-stack application that scrapes blog articles from BeyondChats, manages them via a REST API, and uses an automated AI agent to enhance content with external research. Features a modern, interactive UI with dark mode, search, filtering, and bookmarking capabilities.

## 🚀 Project Overview

This project successfully implements all 3 phases of the challenge plus enhanced interactive features:

1.  **Phase 1 (Backend & Scraping)**: **Comprehensive scraping** of **93 articles** from *BeyondChats* blog (2024-2025) covering AI, healthcare, business, marketing, and technology topics. Features dynamic pagination scraping and stores them in a SQLite database with a CRUD API.
2.  **Phase 2 (AI Automation)**: A robust script that searches Google for the latest article's title, scrapes external references (Wiki/IBM), and uses a simulated LLM to "enhance" the original article with new insights and citations.
3.  **Phase 3 (Frontend)**: A responsive, "premium" React + Tailwind CSS dashboard that displays original and AI-enhanced articles with interactive features.

### ✨ **Enhanced Features:**
- **🌙 Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **🔍 Search & Filter**: Real-time search by title/content and filter by article type (All, AI Enhanced, Original)
- **📚 Bookmarking**: Save favorite articles with persistent localStorage
- **📊 Reading Progress**: Visual progress indicator when reading articles
- **🎨 Interactive UI**: Smooth animations, hover effects, and micro-interactions
- **📱 Responsive Design**: Optimized for all screen sizes
- **🤖 AI-Powered Search**: Intelligent semantic search with fallback to regular search
- **📈 Real Data Only**: No mock/demo data - everything is scraped from live BeyondChats content
- **🧠 Smart Summarization**: AI-generated article summaries using extractive summarization
- **⏱️ Reading Time Estimation**: Automatic calculation based on word count (200 WPM)
- **🏷️ Content Categorization**: Intelligent categorization (AI & Technology, Healthcare, Business & Marketing, Web Development, General)
- **🔗 Related Articles**: Jaccard similarity-based recommendations
- **📊 Enhanced Metadata**: Word count, category tags, and AI enhancement indicators

**Technical Note**: Due to the local environment lacking PHP/Composer, the Backend (Phase 1) was implemented in **Node.js/Express** instead of Laravel. It fulfills all functional requirements (CRUD, Database, API).

---

## 🤖 AI Features

### **Smart Article Summarization**
- **Algorithm**: Extractive summarization using sentence scoring based on word frequency
- **Display**: AI-generated summaries shown in article cards and modal
- **Purpose**: Helps users quickly understand article content before reading

### **Reading Time Estimation**
- **Calculation**: Word count ÷ 200 words per minute (industry standard)
- **Display**: "X min read" shown next to publication date
- **Accuracy**: Accounts for actual content length, not just character count

### **Automatic Content Categorization**
- **Categories**: AI & Technology, Healthcare, Business & Marketing, Web Development, General
- **Algorithm**: Keyword-based matching requiring 2+ matches for categorization
- **Display**: Category tags on article cards with filter support

### **AI-Powered Search**
- **Features**: Semantic search with weighted scoring (title matches higher)
- **Debouncing**: 500ms delay to prevent excessive API calls
- **Fallback**: Graceful degradation to regular search if AI search fails
- **Scoring**: Title matches (10 points), content matches (2 points), semantic matches (1-3 points)

### **Related Articles Recommendations**
- **Algorithm**: Jaccard similarity comparing word overlap between articles
- **Display**: Up to 3 related articles in modal with summaries
- **Performance**: Efficient set-based similarity calculation

### **Enhanced Article Metadata**
- **Word Count**: Automatic calculation for all articles
- **AI Enhancement Indicators**: Visual badges for AI-enhanced content
- **Smart Previews**: Intelligent content truncation preserving meaning

### **API Endpoints**
```
GET /api/articles/enhanced     # Articles with AI metadata
GET /api/articles/:id/enhanced # Single enhanced article
GET /api/articles/:id/related  # Related articles (Jaccard similarity)
GET /api/articles/search/ai    # AI-powered semantic search
```

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Framer Motion
*   **Backend**: Node.js, Express
*   **Database**: SQLite (`articles.db`)
*   **Automation**: Puppeteer (Headless Browser), Axios, Cheerio
*   **AI/NLP**: Natural (tokenization, text processing, semantic analysis)
*   **UI Features**: Dark Mode, Search & Filtering, Bookmarks, Reading Progress, Responsive Design

---

## 📦 Installation & Setup

### Prerequisites
Ensure you have **Node.js** installed (v16+ recommended).

### Install Dependencies
Run the following commands in the root directory:

```bash
# Install Backend & Script dependencies
npm install

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

---

## 🏃‍♂️ How to Run

**Note**: Start the backend server first, as both the frontend and automation scripts depend on the API. The SQLite database (`articles.db`) will be created automatically when you run the scraping script.

### Step 1: Start the Backend API
This serves the articles on `http://localhost:3000`.

```bash
npm start
# or
node server.js
```

### Step 2: Scrape Articles from BeyondChats
Choose one of the scraping options based on your needs:

**Option A: Comprehensive Scrape (Recommended)**
To populate the database with ALL articles from BeyondChats (93+ articles across all pages):

```bash
npm run scrape-all
# or
node scrape_all_articles.js
```

**Option B: Recent Articles Only**
To populate the database with recent trending articles from BeyondChats:

```bash
npm run scrape
# or
node scrape_and_store.js
```

### Step 3: Start the Frontend
In a new terminal window:

```bash
cd frontend
npm run dev
```
Open your browser to: **http://localhost:5173** (or the port shown in terminal).

### Step 4: (Optional) Run the AI Agent
To enhance the latest article with external research:

```bash
npm run update
# or
node update_article.js
```
*   **What happens?**: The script fetches the latest article, searches Google, scrapes 2 sources, updates the DB with an "AI Enhanced" section, and added citations.
*   **Check Frontend**: Refresh the page to see the green **"AI Enhanced"** badge on the latest article.

---

## 📡 API Endpoints

The backend provides a REST API for managing articles:

### **Standard CRUD Endpoints:**
- `GET /api/articles` - Retrieve all articles
- `GET /api/articles/:id` - Retrieve a single article by ID
- `POST /api/articles` - Create a new article
- `PUT /api/articles/:id` - Update an article by ID
- `DELETE /api/articles/:id` - Delete an article by ID

### **AI-Enhanced Endpoints:**
- `GET /api/articles/enhanced` - Retrieve all articles with AI metadata (summaries, categories, reading time)
- `GET /api/articles/:id/enhanced` - Retrieve single article with AI enhancements
- `GET /api/articles/:id/related` - Get related articles using Jaccard similarity
- `GET /api/articles/search/ai?q=query` - AI-powered semantic search

Example response for `GET /api/articles/enhanced`:

```json
{
  "message": "success",
  "data": [
    {
      "id": 6,
      "title": "Which chatbot is right for your business: Intercom vs BeyondChats",
      "url": "https://beyondchats.com/blogs/beyondchats-vs-intercom-comparison/",
      "content": "<p>Article content...</p>",
      "published_date": "2025-02-26",
      "updated_content": "Enhanced content with AI insights...",
      "summary": "AI-generated summary of the article...",
      "readingTime": 5,
      "category": "Business & Marketing",
      "wordCount": 1200,
      "isEnhanced": true,
      "created_at": "2025-02-26T00:00:00.000Z"
    }
  ]
}
```

---

## 🎨 Features & Highlights

### **Core Features:**
*   **Premium UI**: Glass-morphism effects, smooth staggered animations, and a clean "BeyondChats" inspired color palette.
*   **Comprehensive Scraper**: Advanced web scraping system that dynamically discovers and collects all articles from BeyondChats blog (93+ articles) with automatic pagination handling.
*   **Real Data Only**: No mock or sample data - all content is scraped directly from the source website with proper error handling and duplicate prevention.
*   **Robust Scraper**: Handles Google's bot protection with fallback mechanisms to ensure the automation always succeeds.
*   **Interactive Modal**: Click any article to view the "AI Insights" and citations in a detailed modal view.
*   **Responsive Design**: Fully optimized for mobile and desktop screens.
*   **AI Enhancement**: Simulated LLM integration for content enrichment with external references.

### **🎯 Interactive Features:**
*   **🌙 Dark Mode Toggle**: Switch between light and dark themes with persistent localStorage
*   **🔍 Real-time Search**: Filter articles by title and content with instant results
*   **🏷️ Smart Filtering**: Filter by article type (All, AI Enhanced, Original) with live counts
*   **⭐ Bookmark System**: Save favorite articles with persistent bookmarking
*   **📊 Reading Progress**: Visual progress bar showing reading completion in modals
*   **🎭 Smooth Animations**: Enhanced micro-interactions and hover effects throughout
*   **📱 Mobile-First**: Touch-friendly interactions optimized for all devices

---

## 📂 Project Structure

```
beyondchats-content-manager/
├── server.js                 # Express API server (CRUD operations)
├── scrape_and_store.js       # Basic scraping script (recent articles only)
├── scrape_all_articles.js    # Comprehensive scraper (all 93+ articles with pagination)
├── update_article.js         # AI automation script (Phase 2)
├── articles.db               # SQLite database file
├── vercel.json               # Vercel deployment configuration
├── package.json              # Backend dependencies and scripts
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # React entry point
│   │   └── ...
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── ...
└── README.md                 # This file
```

---

## 🚀 Deployment

The application is configured for deployment on Vercel (frontend + backend) and Render (backend API).

- Frontend builds to `dist/` directory using Vite
- Backend uses `@vercel/node` for serverless functions
- Database is SQLite (file-based, suitable for demo purposes)

For production deployment, consider using a cloud database like PostgreSQL.

---

## 📄 License

This project is licensed under the ISC License.
