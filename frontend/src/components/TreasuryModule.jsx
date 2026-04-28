/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingUp, ShieldAlert, Newspaper, Activity, Trash2, Search, ArrowRight, Moon, Sun, X } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

const POPULAR_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: '^NSEI', name: 'Nifty 50' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Ind.' },
  { symbol: 'TCS.NS', name: 'TCS' }
];

export default function TreasuryModule() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('treasury');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // --- Modal State ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  // --- Exp 1: ARIMA State ---
  const [stockForecast, setStockForecast] = useState(null);
  const [tickerInput, setTickerInput] = useState('SPY'); 
  const [activeTicker, setActiveTicker] = useState('SPY'); 
  const [intervalVal, setIntervalVal] = useState('1d'); 
  const [period, setPeriod] = useState('1y'); 
  const [forecastSteps, setForecastSteps] = useState(7);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // --- Autocomplete State ---
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // --- Exp 6: Audit State ---
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ vendor: '', amount: '', category_code: 0 });

  // --- Exp 3 & 4 State ---
  const [vendorData, setVendorData] = useState({ delay_days: 0, defect_rate: 0.01, past_disputes: 0 });
  const [vendorResult, setVendorResult] = useState(null);
  const [headline, setHeadline] = useState('');
  const [nlpResult, setNlpResult] = useState(null);
  const [loadingNlp, setLoadingNlp] = useState(false);

  // --- Click Outside Hook ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Secure Fetch Callbacks ---
  const fetchForecast = useCallback(async () => {
    setLoadingChart(true);
    setChartError(null);
    try {
      const res = await axios.get(`${API_BASE}/invest/forecast?ticker=${activeTicker}&period=${period}&interval=${intervalVal}&steps=${forecastSteps}`);
      if (res.data.error) {
        setChartError(res.data.error);
        setStockForecast(null);
      } else {
        setStockForecast(res.data);
      }
    } catch (error) {
      console.error("Forecast fetch failed:", error);
      setChartError("Failed to connect to backend server.");
      setStockForecast(null);
    }
    setLoadingChart(false);
  }, [activeTicker, intervalVal, period, forecastSteps]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/transactions`);
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
    fetchTransactions();
  }, [fetchForecast, fetchTransactions]); 

  // --- Handlers ---
  const handleTickerChange = (e) => {
    const val = e.target.value;
    setTickerInput(val);
    if (val.length > 0) {
      const filtered = POPULAR_TICKERS.filter(t => t.symbol.toLowerCase().includes(val.toLowerCase()) || t.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol) => {
    setTickerInput(symbol);
    setActiveTicker(symbol);
    setShowSuggestions(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      setActiveTicker(tickerInput.toUpperCase().trim());
      setShowSuggestions(false);
    }
  };

  const submitTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/transactions`, { ...newTx, amount: parseFloat(newTx.amount), category_code: parseInt(newTx.category_code) });
      setNewTx({ vendor: '', amount: '', category_code: 0 });
      fetchTransactions();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  const confirmDelete = async () => {
    if (!txToDelete) return;
    try {
      await axios.delete(`${API_BASE}/transactions/${txToDelete}`);
      setDeleteModalOpen(false);
      setTxToDelete(null);
      fetchTransactions(); 
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const submitVendorRisk = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/vendor/risk`, { delay_days: parseFloat(vendorData.delay_days), defect_rate: parseFloat(vendorData.defect_rate), past_disputes: parseInt(vendorData.past_disputes) });
      setVendorResult(res.data);
    } catch (error) {
      console.error("Vendor Risk failed:", error);
    }
  };

  const submitNlp = async (e) => {
    e.preventDefault();
    setLoadingNlp(true);
    try {
      const res = await axios.post(`${API_BASE}/market/sentiment`, { headline });
      setNlpResult(res.data);
    } catch (error) {
      console.error("NLP failed:", error);
    }
    setLoadingNlp(false);
  };

  // --- Render ---
  return (
    <div className={`${isDarkMode ? 'dark' : ''} w-full`}>
      <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0B1121] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-16">
        
        {/* --- Delete Confirmation Modal --- */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4 transform transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full">
                  <Trash2 size={24} />
                </div>
                <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Delete Record?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Are you sure you want to permanently delete this audit log? This action cannot be reversed.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalOpen(false)} className="px-5 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-3 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Header --- */}
        <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#080d1a] dark:via-[#0c1427] dark:to-[#080d1a] text-white p-10 pb-24 w-full border-b border-slate-700/50 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 dark:to-blue-200">AI FinOps Module</h1>
              <p className="text-slate-400 dark:text-slate-500 mt-2 text-lg font-medium tracking-wide">Quantitative Risk Engine & Predictive Treasury</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-3 rounded-full bg-slate-800/80 dark:bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 dark:border-slate-600 shadow-inner text-yellow-400 dark:text-blue-300"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="flex items-center gap-3 bg-slate-800/80 dark:bg-slate-800 backdrop-blur px-5 py-2.5 rounded-full border border-slate-700 dark:border-slate-600 shadow-inner">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <span className="font-bold text-sm tracking-wide text-emerald-50">System Active</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 -mt-12 relative z-20">
          
          {/* --- KPI Cards --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={32} strokeWidth={2.5}/></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Investable Cash</p><p className="text-3xl font-black text-slate-800 dark:text-white">$1.24M</p></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:scale-110 transition-transform"><ShieldAlert size={32} strokeWidth={2.5}/></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Anomalies Detected</p><p className="text-3xl font-black text-slate-800 dark:text-white">{transactions.filter(t => t.is_anomaly).length}</p></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-4 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform"><Newspaper size={32} strokeWidth={2.5}/></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Active ML Models</p><p className="text-3xl font-black text-slate-800 dark:text-white">4</p></div>
            </div>
          </div>

          {/* --- Navigation --- */}
          <div className="flex flex-wrap gap-2 mb-10 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 w-fit">
            {['treasury', 'audit', 'vendor', 'market'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === tab ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'}`}
              >
                {tab === 'treasury' && 'Market Forecast (ARIMA)'}
                {tab === 'audit' && 'Expense Audit (Isolation Forest)'}
                {tab === 'vendor' && 'Vendor Risk (Random Forest)'}
                {tab === 'market' && 'Market Intel (NLP/BERT)'}
              </button>
            ))}
          </div>

          {/* --- TAB 1: DYNAMIC TREASURY (ARIMA) --- */}
          {activeTab === 'treasury' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Investment Forecast</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Experiment 1: ARIMA prediction engine powered by yfinance.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                  {stockForecast && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-6 py-4 rounded-2xl flex flex-col items-end shadow-sm">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{stockForecast.ticker} Market Price</span>
                      <span className="text-4xl font-black text-slate-900 dark:text-white">${stockForecast.current_price}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8 w-full xl:w-auto items-end">
                <form onSubmit={handleSearch} className="flex gap-3 items-end relative" ref={wrapperRef}>
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Ticker Search</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" value={tickerInput} onChange={handleTickerChange} onFocus={() => tickerInput.length > 0 && setShowSuggestions(true)} placeholder="e.g. AAPL" className="block w-64 pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all relative z-20" />
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute left-0 top-[85px] w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl max-h-60 overflow-y-auto z-50 py-2">
                        {suggestions.map((item) => (
                          <li key={item.symbol} onClick={() => selectSuggestion(item.symbol)} className="px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-500/20 cursor-pointer flex justify-between items-center transition-colors">
                            <span className="font-bold text-slate-800 dark:text-white">{item.symbol}</span>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate ml-3">{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="submit" className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-md">Search</button>
                </form>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Interval</label>
                  <select value={intervalVal} onChange={(e) => { const val = e.target.value; setIntervalVal(val); if (val === '15m' || val === '1h') setPeriod('1mo'); else setPeriod('1y'); }} className="block w-40 py-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                    <option value="15m">15 Minute</option><option value="1h">1 Hour</option><option value="1d">1 Day</option><option value="1wk">1 Week</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Forecast Output</label>
                  <select value={forecastSteps} onChange={(e) => setForecastSteps(parseInt(e.target.value))} className="block w-48 py-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                    <option value={7}>Next 7 Periods</option><option value={14}>Next 14 Periods</option><option value={30}>Next 30 Periods</option>
                  </select>
                </div>
              </div>
              
              {loadingChart ? (
                <div className="h-[550px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Activity className="animate-spin text-blue-500 mb-5" size={48} />
                  <p className="text-xl font-bold text-slate-500 dark:text-slate-400 animate-pulse">Computing ARIMA Mathematics...</p>
                </div>
              ) : chartError ? (
                <div className="h-[550px] flex items-center justify-center bg-rose-50/50 dark:bg-rose-500/5 rounded-3xl border-2 border-dashed border-rose-200 dark:border-rose-500/20">
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center bg-white dark:bg-slate-900 px-8 py-5 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-500/20"><AlertTriangle className="mr-3" size={24} /> {chartError}</p>
                </div>
              ) : (
                <div className="h-[550px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stockForecast?.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={isDarkMode ? 0.4 : 0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                      <XAxis dataKey="date" stroke={isDarkMode ? "#64748b" : "#94a3b8"} tick={{fontSize: 12, fontWeight: 600}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke={isDarkMode ? "#64748b" : "#94a3b8"} domain={['auto', 'auto']} tick={{fontSize: 12, fontWeight: 600}} tickLine={false} axisLine={false} dx={-10} width={60} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000', borderRadius: '16px', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px', fontWeight: 'bold' }} />
                      
                      {/* Using a single Area tag ensures NO double tooltip for market price */}
                      <Area type="monotone" dataKey="actual_price" name="Market Price" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" activeDot={{r: 8, strokeWidth: 0, fill: '#3B82F6'}} />
                      <Line type="monotone" dataKey="predicted_price" name="ARIMA Forecast" stroke="#F59E0B" strokeWidth={4} strokeDasharray="8 8" dot={{r: 4, fill: '#F59E0B', strokeWidth: 0}} activeDot={{r: 8}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 2: AI AUDIT --- */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 h-fit xl:sticky top-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Log Expense</h2>
                <form onSubmit={submitTransaction} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Vendor Name</label>
                    <input type="text" placeholder="e.g. Office Depot" value={newTx.vendor} onChange={e => setNewTx({...newTx, vendor: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Amount ($)</label>
                    <input type="number" placeholder="0.00" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Expense Category</label>
                    <select value={newTx.category_code} onChange={e => setNewTx({...newTx, category_code: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer">
                      <option value={0}>Office Supplies</option><option value={1}>Travel</option><option value={2}>Meals</option><option value={3}>Misc</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-300 font-bold shadow-lg flex items-center justify-center gap-2 mt-4">
                    Run Isolation Forest Audit <ArrowRight size={18} />
                  </button>
                </form>
              </div>
              
              <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Live Audit Ledger</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time anomaly detection logs.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider text-xs">
                        <tr><th className="px-8 py-5">Vendor</th><th className="px-8 py-5">Amount</th><th className="px-8 py-5">AI Status</th><th className="px-8 py-5 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-8 py-6 font-bold text-slate-800 dark:text-white">{tx.vendor}</td>
                            <td className="px-8 py-6 font-medium text-slate-600 dark:text-slate-300">${tx.amount.toFixed(2)}</td>
                            <td className="px-8 py-6">
                              {tx.is_anomaly ? <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg text-xs font-bold border border-rose-100 dark:border-rose-500/20 flex w-fit items-center"><AlertTriangle size={14} className="mr-2"/> Flagged</span> : <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-500/20 flex w-fit items-center"><CheckCircle size={14} className="mr-2"/> Approved</span>}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => {setTxToDelete(tx.id); setDeleteModalOpen(true);}} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Log">
                                 <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {transactions.length === 0 && <tr><td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-medium">No expenses logged. Run an audit to see results.</td></tr>}
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 3: VENDOR RISK --- */}
          {activeTab === 'vendor' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Vendor Risk Assessment</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">Experiment 3: Run Random Forest classification on vendor history to prevent paying high-risk suppliers in advance.</p>
                
                <form onSubmit={submitVendorRisk} className="space-y-8">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Average Delivery Delay (Days)</label>
                    <input type="number" step="0.1" value={vendorData.delay_days} onChange={e => setVendorData({...vendorData, delay_days: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Defect Rate</label>
                    <p className="text-xs text-slate-400 mt-1 mb-2 font-medium">Enter as a decimal (e.g. 0.05 for 5%)</p>
                    <input type="number" step="0.01" value={vendorData.defect_rate} onChange={e => setVendorData({...vendorData, defect_rate: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Past Financial Disputes</label>
                    <input type="number" value={vendorData.past_disputes} onChange={e => setVendorData({...vendorData, past_disputes: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl hover:bg-blue-700 transition font-black shadow-lg shadow-blue-500/30 text-lg mt-4">Compute Risk Score</button>
                </form>
              </div>
              
              <div className="flex flex-col">
                {vendorResult ? (
                  <div className={`p-12 rounded-3xl shadow-2xl border-2 h-full flex flex-col items-center justify-center text-center transition-all ${vendorResult.is_risky ? 'bg-rose-50/80 dark:bg-rose-900/10 border-rose-200 dark:border-rose-500/30' : 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30'}`}>
                    <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-widest">AI Trust Score</h3>
                    <div className={`text-9xl font-black mb-8 drop-shadow-sm ${vendorResult.is_risky ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                      {vendorResult.credit_score}<span className="text-5xl text-slate-300 dark:text-slate-700 opacity-80">/100</span>
                    </div>
                    <p className="text-4xl font-extrabold text-slate-800 dark:text-white mb-6">{vendorResult.is_risky ? 'High Risk Vendor' : 'Reliable Vendor'}</p>
                    <p className={`px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest ${vendorResult.is_risky ? 'bg-rose-200 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>{vendorResult.recommendation}</p>
                  </div>
                ) : (
                  <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center p-12 text-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-[#0f172a]">
                    <p className="text-xl font-medium max-w-sm">Enter vendor metrics and run the Random Forest model to generate a live risk score.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- TAB 4: MARKET NLP --- */}
          {activeTab === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Financial News Sentiment</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">Experiment 4: Process unstructured text using a HuggingFace BERT Neural Network.</p>
                
                <form onSubmit={submitNlp} className="space-y-8">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">Paste Financial Headline</label>
                    <textarea rows="6" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g., Global supply chain disruptions expected to severely impact tech hardware profits..." className="w-full p-6 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl resize-none font-medium dark:text-white focus:ring-4 focus:ring-purple-500/20 outline-none transition-all leading-relaxed" required />
                  </div>
                  <button type="submit" disabled={loadingNlp} className={`w-full text-white p-5 rounded-2xl transition-all font-black shadow-lg text-lg flex justify-center items-center ${loadingNlp ? 'bg-purple-400 dark:bg-purple-800 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'}`}>
                    {loadingNlp ? <><Activity className="animate-spin mr-3" size={24}/> Analyzing Neural Weights...</> : "Run NLP Pipeline"}
                  </button>
                </form>
              </div>
              
              <div className="flex flex-col">
                {nlpResult ? (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-center relative overflow-hidden">
                    <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-20 ${nlpResult.sentiment === 'POSITIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    
                    <p className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-10 relative z-10">BERT Pipeline Output</p>
                    
                    <div className="space-y-12 relative z-10">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold uppercase tracking-wider">Detected Sentiment</p>
                        
                        {/* FIX: Changed to w-fit and inline-flex to guarantee it NEVER overlaps the progress bar below it */}
                        <div className={`w-fit inline-flex px-8 py-4 rounded-2xl text-2xl md:text-3xl font-black tracking-widest shadow-sm border ${nlpResult.sentiment === 'POSITIVE' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}`}>
                          {nlpResult.sentiment}
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div className="flex justify-between items-end mb-4">
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Model Confidence</p>
                          <span className="font-black text-slate-800 dark:text-white text-3xl">{nlpResult.confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-5 shadow-inner overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ease-out rounded-full ${nlpResult.sentiment === 'POSITIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${nlpResult.confidence}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center p-12 text-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-[#0f172a]">
                     <p className="text-xl font-medium max-w-sm">Paste a news article and run the NLP pipeline to detect market sentiment.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}