import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

// Use the Environment Variable if available, otherwise fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/articles';

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    setStoredTheme(isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [response] = await Promise.all([
          axios.get(API_URL),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        const sorted = response.data.data.sort((a, b) => b.id - a.id)
        setArticles(sorted)
        setFilteredArticles(sorted)
      } catch (error) {
        console.error("Error fetching articles", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = articles

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPreview(article.content).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType === 'enhanced') {
      filtered = filtered.filter(article => article.updated_content)
    } else if (filterType === 'original') {
      filtered = filtered.filter(article => !article.updated_content)
    }

    setFilteredArticles(filtered)
  }, [articles, searchTerm, filterType])

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify([...bookmarkedArticles]))
  }, [bookmarkedArticles])

  const toggleTheme = () => setIsDark(!isDark)

  const openArticle = (article) => {
    setSelectedArticle(article)
    setReadingProgress(0)
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
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
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
        {loading ? (
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
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredArticles.map((article) => {
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

                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <span className="font-medium bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">{article.published_date}</span>
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

                      <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 line-clamp-3">
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

            {/* No Results Message */}
            {filteredArticles.length === 0 && (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search terms or filters</p>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
