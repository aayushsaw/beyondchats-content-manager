import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

// Use the Environment Variable if available, otherwise fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/articles';


const ArticleSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm animate-pulse h-full">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="flex justify-between mb-6">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-32"></div>
  </div>
)

function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    // Artificial minimum delay to show off the skeleton loading animation
    const loadData = async () => {
      try {
        const [response] = await Promise.all([
          axios.get(API_URL),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        const sorted = response.data.data.sort((a, b) => b.id - a.id)
        setArticles(sorted)
      } catch (error) {
        console.error("Error fetching articles", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const openArticle = (article) => setSelectedArticle(article)
  const closeArticle = () => setSelectedArticle(null)

  const getPreview = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/30 font-sans">
      <header className="py-12 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            BeyondChats <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Insights</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-xl mx-auto leading-relaxed">
            Curated articles, enhanced with AI analysis for deeper understanding.
          </p>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5].map((n) => <ArticleSkeleton key={n} />)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {articles.map((article) => {
              const isUpdated = !!article.updated_content;
              return (
                <motion.div
                  key={article.id}
                  variants={itemVariants}
                  className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-primary to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div>
                    <motion.div
                      className="text-2xl font-bold mb-3 text-gray-900 cursor-pointer group-hover:text-accent-primary transition-colors leading-tight"
                      onClick={() => openArticle(article)}
                      whileHover={{ x: 2 }}
                    >
                      {article.title}
                    </motion.div>

                    <div className="flex justify-between items-center text-sm text-text-secondary mb-6">
                      <span className="font-medium bg-gray-50 px-2 py-1 rounded">{article.published_date}</span>
                      {isUpdated ? (
                        <span className="relative inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 overflow-hidden">
                          <span className="absolute inset-0 bg-green-200 opacity-20 animate-pulse"></span>
                          <span className="relative flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            AI Enhanced
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Original</span>
                      )}
                    </div>

                    <div className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                      {getPreview(article.content)}
                    </div>
                  </div>

                  <motion.button
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all bg-gray-50 text-gray-700 hover:bg-accent-primary hover:text-white flex items-center justify-center gap-2 group-hover:shadow-md"
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
      </main>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            className="fixed inset-0 bg-gray-900/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeArticle}
          >
            <motion.div
              className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl p-8 md:p-10 text-left overflow-y-auto shadow-2xl relative"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
                onClick={closeArticle}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="border-b border-gray-100 pb-6 mb-8 pr-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{selectedArticle.title}</h2>
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-accent-primary hover:text-blue-700 font-medium transition-colors"
                >
                  View Original Source
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>

              <div className="prose prose-lg prose-indigo max-w-none text-gray-700">
                {selectedArticle.updated_content ? (
                  <div className="animate-fadeIn">
                    <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full opacity-20 blur-xl"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600 mt-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div>
                          <h3 className="text-green-900 font-bold text-lg mb-1 mt-0">AI Enhanced Insights</h3>
                          <p className="text-green-800 text-sm m-0 leading-relaxed">This article has been updated with the latest information from verified external sources.</p>
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
