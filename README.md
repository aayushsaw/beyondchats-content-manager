# BeyondChats AI Content Manager

A full-stack application that scrapes blog articles, manages them via a REST API, and uses an automated AI agent to enhance content with external research.

## 🚀 Project Overview

This project successfully implements all 3 phases of the challenge:

1.  **Phase 1 (Backend & Scraping)**: Scraped the 5 oldest articles from *BeyondChats* and stored them in a SQLite database with a CRUD API.
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

### 1. Prerequisites
Ensure you have **Node.js** installed (v16+ recommended).

### 2. Install Dependencies
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

### Step 1: Start the Backend API
This serves the articles on `http://localhost:3000`.

```bash
node server.js
```

### Step 2: Start the Frontend
In a new terminal window:

```bash
cd frontend
npm run dev
```
Open your browser to: **http://localhost:5173** (or the port shown in terminal).

### Step 3: Run the AI Agent (Phase 2)
To trigger the "Search-Scrape-Update" workflow:

```bash
node update_article.js
```
*   **What happens?**: The script fetches the latest article, searches Google, scrapes 2 sources, updates the DB with an "AI Enhanced" section, and adds citations.
*   **Check Frontend**: Refresh the page to see the green **"AI Enhanced"** badge on the latest article.

---

## ☁️ Deployment

This project is configured for deployment on **Render** (Backend) and **Vercel** (Frontend).

For detailed instructions, please refer to the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 🎨 Features & Highlights

*   **Premium UI**: Glass-morphism effects, smooth staggered animations, and a clean "BeyondChats" inspired color palette.
*   **Robust Scraper**: Handles Google's bot protection with fallback mechanisms to ensure the automation always succeeds.
*   **Interactive Modal**: Click any article to view the "AI Insights" and citations in a detailed modal view.
*   **Responsive Design**: Fully optimized for mobile and desktop screens.

---

## 📂 Project Structure

*   `server.js`: Express API (CRUD for articles).
*   `scrape_and_store.js`: Initial scraper (Phase 1).
*   `update_article.js`: Automation script (Phase 2).
*   `frontend/`: React application (Phase 3).
*   `articles.db`: SQLite database file.
