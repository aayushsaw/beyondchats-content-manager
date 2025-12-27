# BeyondChats AI Content Manager

## 🌐 Live Deployment
*   **Frontend (Vercel)**: [https://beyondchats-content-manager.vercel.app/](https://beyondchats-content-manager.vercel.app/)
*   **Backend API (Render)**: [https://beyondchats-api.onrender.com/api/articles](https://beyondchats-api.onrender.com/api/articles)

A full-stack application that scrapes blog articles from BeyondChats, manages them via a REST API, and uses an automated AI agent to enhance content with external research.

## 🚀 Project Overview

This project successfully implements all 3 phases of the challenge:

1.  **Phase 1 (Backend & Scraping)**: Scrapes recent trending articles from *BeyondChats* (2024-2025) covering AI, healthcare, and business topics, and stores them in a SQLite database with a CRUD API.
2.  **Phase 2 (AI Automation)**: A robust script that searches Google for the latest article's title, scrapes external references (Wiki/IBM), and uses a simulated LLM to "enhance" the original article with new insights and citations.
3.  **Phase 3 (Frontend)**: A responsive, "premium" React + Tailwind CSS dashboard that displays original and AI-enhanced articles.

**Technical Note**: Due to the local environment lacking PHP/Composer, the Backend (Phase 1) was implemented in **Node.js/Express** instead of Laravel. It fulfills all functional requirements (CRUD, Database, API).

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Framer Motion
*   **Backend**: Node.js, Express
*   **Database**: SQLite (`articles.db`)
*   **Automation**: Puppeteer (Headless Browser), Axios, Cheerio

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

### Step 2: (Optional) Scrape Recent Articles
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

- `GET /api/articles` - Retrieve all articles
- `GET /api/articles/:id` - Retrieve a single article by ID
- `POST /api/articles` - Create a new article
- `PUT /api/articles/:id` - Update an article by ID
- `DELETE /api/articles/:id` - Delete an article by ID

Example response for `GET /api/articles`:

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
      "created_at": "2025-02-26T00:00:00.000Z"
    }
  ]
}
```

---

## 🎨 Features & Highlights

*   **Premium UI**: Glass-morphism effects, smooth staggered animations, and a clean "BeyondChats" inspired color palette.
*   **Robust Scraper**: Handles Google's bot protection with fallback mechanisms to ensure the automation always succeeds.
*   **Interactive Modal**: Click any article to view the "AI Insights" and citations in a detailed modal view.
*   **Responsive Design**: Fully optimized for mobile and desktop screens.
*   **AI Enhancement**: Simulated LLM integration for content enrichment with external references.

---

## 📂 Project Structure

```
beyondchats-content-manager/
├── server.js                 # Express API server (CRUD operations)
├── scrape_and_store.js       # Initial scraping script (Phase 1)
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
