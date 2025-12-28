import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

// Use the Environment Variable if available, otherwise fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/articles';

// Theme and localStorage utilities
const getStoredTheme = () => localStorage.getItem('theme') || 'light';
const setStoredTheme = (theme) => localStorage.setItem('theme', theme);

const ArticleSkeleton = ({ isDark }) => (
  <div className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 shadow-sm animate-pulse h-full`}>
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="flex justify-between mb-6">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
  </div>
)

const ThemeToggle = ({ isDark, toggleTheme }) => (
  <motion.button
    onClick={toggleTheme}
    className="fixed top-6 right-6 z-40 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {isDark ? (
      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    )}
  </motion.button>
)

function App() {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [isDark, setIsDark] = useState(getStoredTheme() === 'dark')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'enhanced', 'original'
  const [bookmarkedArticles, setBookmarkedArticles] = useState(new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]')))
  const [readingProgress, setReadingProgress] = useState(0)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [isAISearch, setIsAISearch] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    setStoredTheme(isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data...')
      setError(null) // Reset error state
      try {
        const [response] = await Promise.all([
          axios.get(`${API_URL}`),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        const sorted = response.data.data.sort((a, b) => b.id - a.id)
        console.log('Loaded articles from API:', sorted.length)
        setArticles(sorted)
        setFilteredArticles(sorted)
      } catch (error) {
        console.error("Error fetching articles:", error)
        setError("Unable to load articles from the server. Please check your connection and try again.")
        setArticles([])
        setFilteredArticles([])
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = articles

    // Apply search filter
    if (searchTerm) {
      if (isAISearch) {
        // AI-powered search will be handled separately
        return;
      } else {
        // Regular search
        filtered = filtered.filter(article =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getPreview(article.content).toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
    }

    // Apply type filter
    if (filterType === 'enhanced') {
      filtered = filtered.filter(article => article.updated_content)
    } else if (filterType === 'original') {
      filtered = filtered.filter(article => !article.updated_content)
    }

    setFilteredArticles(filtered)
  }, [articles, searchTerm, filterType, isAISearch])

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify([...bookmarkedArticles]))
  }, [bookmarkedArticles])

  const toggleTheme = () => setIsDark(!isDark)

  const performAISearch = async (query) => {
    if (!query.trim()) {
      setFilteredArticles(articles)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/search/ai?q=${encodeURIComponent(query)}`)
      setFilteredArticles(response.data.data)
    } catch (error) {
      console.error("AI search failed:", error)
      setError("AI search is currently unavailable. Please use regular search.")
      setFilteredArticles(articles) // Reset to show all articles
    } finally {
      setLoading(false)
    }
  }

  const openArticle = async (article) => {
    setSelectedArticle(article)
    setReadingProgress(0)

    // Fetch related articles
    try {
      const response = await axios.get(`${API_URL}/${article.id}/related`)
      setRelatedArticles(response.data.data)
    } catch (error) {
      console.error("Error fetching related articles, using mock data", error)
      // Mock related articles for demonstration
      const mockRelated = articles
        .filter(a => a.id !== article.id)
        .slice(0, 2)
        .map(a => ({
          ...a,
          similarity: Math.random() * 0.3 + 0.1
        }));
      setRelatedArticles(mockRelated)
    }
  }

  const closeArticle = () => setSelectedArticle(null)

  const toggleBookmark = (articleId) => {
    const newBookmarks = new Set(bookmarkedArticles)
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId)
    } else {
      newBookmarks.add(articleId)
    }
    setBookmarkedArticles(newBookmarks)
  }

  const getPreview = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  const handleScroll = (e) => {
    const element = e.target
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    const progress = (scrollTop / scrollHeight) * 100
    setReadingProgress(Math.min(progress, 100))
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-gradient-to-br from-white to-blue-50/30'}`}>
      <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

      <header className="py-12 px-4 text-center max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            BeyondChats <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Insights</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
            Curated articles, enhanced with AI analysis for deeper understanding.
          </p>
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          className="mt-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isAISearch ? "AI-powered search..." : "Search articles..."}
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  if (isAISearch && value.trim()) {
                    // Debounce AI search
                    clearTimeout(window.aiSearchTimeout);
                    window.aiSearchTimeout = setTimeout(() => performAISearch(value), 500);
                  }
                }}
                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <button
                onClick={() => {
                  setIsAISearch(!isAISearch);
                  if (!isAISearch && searchTerm.trim()) {
                    performAISearch(searchTerm);
                  } else if (isAISearch) {
                    // Reset to regular search
                    setSearchTerm('');
                    setFilteredArticles(articles);
                  }
                }}
                className={`absolute right-3 top-2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  isAISearch
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isAISearch ? 'AI' : 'AI'}
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', count: articles.length },
                { key: 'enhanced', label: 'AI Enhanced', count: articles.filter(a => a.updated_content).length },
                { key: 'original', label: 'Original', count: articles.filter(a => !a.updated_content).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    filterType === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredArticles.length} of {articles.length} articles
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {console.log('Rendering main section, loading:', loading, 'error:', error, 'articles:', articles.length, 'filtered:', filteredArticles.length)}
        {error ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="w-16 h-16 mx-auto text-red-400 dark:text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Articles</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </motion.div>
        ) : loading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => <ArticleSkeleton key={n} isDark={isDark} />)}
          </motion.div>
        ) : (
          <>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 dark:text-gray-400">No articles found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms or filters</p>
              </div>
            ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {console.log('Rendering articles:', filteredArticles)}
              {filteredArticles.map((article) => {
                console.log('Rendering article:', article.id, article.title)
                const isUpdated = !!article.updated_content;
                const isBookmarked = bookmarkedArticles.has(article.id);
                return (
                  <motion.div
                    key={article.id}
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                        isBookmarked
                          ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'text-gray-400 hover:text-yellow-500 bg-white/80 dark:bg-gray-700/80 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                    </button>

                    <div>
                      <motion.div
                        className="text-2xl font-bold mb-3 text-gray-900 dark:text-white cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight pr-12"
                        onClick={() => openArticle(article)}
                        whileHover={{ x: 2 }}
                      >
                        {article.title}
                      </motion.div>

                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span className="font-medium bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">{article.published_date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            {article.readingTime} min
                          </span>
                          {isUpdated ? (
                            <span className="relative inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 overflow-hidden">
                              <span className="absolute inset-0 bg-green-200 dark:bg-green-800 opacity-20 animate-pulse"></span>
                              <span className="relative flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AI Enhanced
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Original</span>
                          )}
                        </div>
                      </div>

                      {/* Categories */}
                      {article.categories && article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.categories.slice(0, 2).map((category, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Summary */}
                      {article.summary && (
                        <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">AI Summary</div>
                          {article.summary}
                        </div>
                      )}

                      {/* Content Preview */}
                      <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 line-clamp-2">
                        {getPreview(article.content)}
                      </div>
                    </div>

                    <motion.button
                      className="w-full py-3 rounded-lg font-semibold text-sm transition-all bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 flex items-center justify-center gap-2 group-hover:shadow-md"
                      onClick={() => openArticle(article)}
                      whileTap={{ scale: 0.98 }}
                    >
                      Read Article
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </motion.button>
                  </motion.div>
                )
              })}
            </motion.div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            className="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80 flex justify-center items-center z-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeArticle}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl dark:shadow-blue-500/10 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Reading Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-10">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  style={{ width: `${readingProgress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${readingProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Header */}
              <div className="p-8 md:p-10 pr-16 border-b border-gray-100 dark:border-gray-700">
                <button
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={closeArticle}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight pr-4">
                    {selectedArticle.title}
                  </h2>

                  {/* Article Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleBookmark(selectedArticle.id)}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        bookmarkedArticles.has(selectedArticle.id)
                          ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'text-gray-400 hover:text-yellow-500 bg-gray-50 dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={bookmarkedArticles.has(selectedArticle.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                    </button>

                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      View Original
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {selectedArticle.published_date}
                  </span>
                  {selectedArticle.updated_content ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      AI Enhanced
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      Original Article
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div
                className="p-8 md:p-10 prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 overflow-y-auto max-h-[60vh]"
                onScroll={handleScroll}
              >
                {selectedArticle.updated_content ? (
                  <div className="animate-fadeIn">
                    <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full opacity-20 blur-xl"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg text-green-600 dark:text-green-400 mt-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div>
                          <h3 className="text-green-900 dark:text-green-100 font-bold text-lg mb-1 mt-0">AI Enhanced Insights</h3>
                          <p className="text-green-800 dark:text-green-300 text-sm m-0 leading-relaxed">This article has been updated with the latest information from verified external sources.</p>
                        </div>
                      </div>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.updated_content }} />
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                )}
              </div>

              {/* Related Articles Section */}
              {relatedArticles.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Related Articles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedArticles.map((relatedArticle) => (
                      <motion.div
                        key={relatedArticle.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                        onClick={() => {
                          closeArticle();
                          setTimeout(() => openArticle(relatedArticle), 300);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {relatedArticle.title}
                        </h4>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{relatedArticle.published_date}</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {relatedArticle.readingTime} min read
                          </span>
                        </div>
                        {relatedArticle.summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                            {relatedArticle.summary}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
