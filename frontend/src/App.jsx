import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingUp, ShieldAlert, Newspaper, Activity } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

function App() {
  const [activeTab, setActiveTab] = useState('treasury');
  
  // Exp 1: ARIMA Dynamic Chart State
  const [stockForecast, setStockForecast] = useState(null);
  const [tickerInput, setTickerInput] = useState('SPY'); // What the user types in the search bar
  const [activeTicker, setActiveTicker] = useState('SPY'); // What is actively charting
  const [interval, setInterval] = useState('1d'); // Default to daily interval
  const [period, setPeriod] = useState('1y'); // history lookback
  const [forecastSteps, setForecastSteps] = useState(7);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Exp 6: Audit State
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ vendor: '', amount: '', category_code: 0 });

  // Exp 3: Vendor Risk State
  const [vendorData, setVendorData] = useState({ delay_days: 0, defect_rate: 0.01, past_disputes: 0 });
  const [vendorResult, setVendorResult] = useState(null);

  // Exp 4: NLP State
  const [headline, setHeadline] = useState('');
  const [nlpResult, setNlpResult] = useState(null);
  const [loadingNlp, setLoadingNlp] = useState(false);

  // Refetch the chart whenever the user submits a new ticker, interval, or forecast step count
  useEffect(() => {
    fetchForecast();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicker, interval, period, forecastSteps]); 

  const fetchForecast = async () => {
    setLoadingChart(true);
    setChartError(null);
    try {
      const res = await axios.get(`${API_BASE}/invest/forecast?ticker=${activeTicker}&period=${period}&interval=${interval}&steps=${forecastSteps}`);
      if (res.data.error) {
        setChartError(res.data.error);
        setStockForecast(null);
      } else {
        setStockForecast(res.data);
      }
    } catch (error) {
      setChartError("Failed to connect to backend server.");
      setStockForecast(null);
    }
    setLoadingChart(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      setActiveTicker(tickerInput.toUpperCase().trim());
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/transactions`);
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const submitTransaction = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/transactions`, { ...newTx, amount: parseFloat(newTx.amount), category_code: parseInt(newTx.category_code) });
    setNewTx({ vendor: '', amount: '', category_code: 0 });
    fetchTransactions();
  };

  const submitVendorRisk = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/vendor/risk`, {
        delay_days: parseFloat(vendorData.delay_days),
        defect_rate: parseFloat(vendorData.defect_rate),
        past_disputes: parseInt(vendorData.past_disputes)
      });
      setVendorResult(res.data);
    } catch (error) {
       console.error("Error running Random Forest:", error);
    }
  };

  const submitNlp = async (e) => {
    e.preventDefault();
    setLoadingNlp(true);
    try {
      const res = await axios.post(`${API_BASE}/market/sentiment`, { headline });
      setNlpResult(res.data);
    } catch (error) {
      console.error("Error running NLP Pipeline:", error);
    }
    setLoadingNlp(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      
      {/* Premium Dark Header */}
      <header className="bg-slate-900 text-white p-8 pb-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FinOps.ai Enterprise</h1>
            <p className="text-slate-400 mt-1">Corporate Treasury & Machine Learning Hub</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-inner">
             <Activity className="text-green-400" size={20} />
             <span className="font-medium text-sm">System Live</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 hover:shadow-lg transition">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={28}/></div>
            <div><p className="text-sm text-gray-500 font-medium">Investable Cash</p><p className="text-2xl font-bold">$1.2M</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 hover:shadow-lg transition">
            <div className="p-4 bg-red-100 text-red-600 rounded-lg"><ShieldAlert size={28}/></div>
            <div><p className="text-sm text-gray-500 font-medium">Anomalies Detected</p><p className="text-2xl font-bold">{transactions.filter(t => t.is_anomaly).length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 hover:shadow-lg transition">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-lg"><Newspaper size={28}/></div>
            <div><p className="text-sm text-gray-500 font-medium">Active ML Models</p><p className="text-2xl font-bold">4</p></div>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-gray-200 w-fit">
          <button onClick={() => setActiveTab('treasury')} className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'treasury' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Market Forecast (ARIMA)</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Expense Audit (Isolation Forest)</button>
          <button onClick={() => setActiveTab('vendor')} className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'vendor' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Vendor Risk (Random Forest)</button>
          <button onClick={() => setActiveTab('market')} className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'market' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Market Intel (NLP/BERT)</button>
        </div>

        {/* --- TAB 1: DYNAMIC TREASURY (ARIMA) --- */}
        {activeTab === 'treasury' && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Live Corporate Investment Forecast</h2>
                <p className="text-gray-500 mt-1">Experiment 1: ARIMA predictions using real-time yfinance data.</p>
              </div>
              
              {/* Dynamic Chart Controls */}
              <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200 w-full lg:w-auto">
                <form onSubmit={handleSearch} className="flex gap-2 items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticker Search</label>
                    <input 
                      type="text" 
                      value={tickerInput} 
                      onChange={(e) => setTickerInput(e.target.value)} 
                      placeholder="e.g. AAPL, TSLA" 
                      className="block w-36 mt-1 bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    />
                  </div>
                  <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition">Search</button>
                </form>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interval</label>
                  <select 
                    value={interval} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setInterval(val);
                      // yfinance has limits on intraday data history. 15m/1h requires a shorter 'period'.
                      if (val === '15m' || val === '1h') setPeriod('1mo');
                      else setPeriod('1y');
                    }} 
                    className="block w-full mt-1 bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="15m">15 Minute</option>
                    <option value="1h">1 Hour</option>
                    <option value="1d">1 Day</option>
                    <option value="1wk">1 Week</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Forecast Output</label>
                  <select 
                    value={forecastSteps} 
                    onChange={(e) => setForecastSteps(parseInt(e.target.value))} 
                    className="block w-full mt-1 bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={7}>Next 7 Periods</option>
                    <option value={14}>Next 14 Periods</option>
                    <option value={30}>Next 30 Periods</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Chart Rendering & Error Handling */}
            {loadingChart ? (
              <div className="h-96 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-gray-300">
                <Activity className="animate-spin text-blue-500 mb-4" size={32} />
                <p className="text-lg font-medium text-gray-500 animate-pulse">Running ARIMA Calculations on Live Data...</p>
              </div>
            ) : chartError ? (
              <div className="h-96 flex items-center justify-center bg-red-50 rounded-xl border border-red-200">
                <p className="text-lg font-medium text-red-600 flex items-center bg-white px-6 py-4 rounded-lg shadow-sm">
                  <AlertTriangle className="mr-3" /> {chartError}
                </p>
              </div>
            ) : (
              <div className="h-96 w-full relative">
                <div className="absolute top-0 right-4 bg-white/80 backdrop-blur px-4 py-2 rounded-lg border shadow-sm z-10 flex flex-col items-end">
                   <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{stockForecast?.ticker} Current Price</p>
                   <p className="text-2xl font-black text-slate-800">${stockForecast?.current_price}</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockForecast?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" tick={{fontSize: 12}} tickMargin={10} />
                    <YAxis stroke="#6B7280" domain={['auto', 'auto']} tick={{fontSize: 12}} width={60} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="actual_price" name="Actual Market Price" stroke="#0F172A" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="predicted_price" name="ARIMA ML Forecast" stroke="#3B82F6" strokeWidth={3} strokeDasharray="5 5" dot={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: AI AUDIT --- */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-fit">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Log Petty Cash Expense</h2>
              <form onSubmit={submitTransaction} className="space-y-4">
                <input type="text" placeholder="Vendor Name" value={newTx.vendor} onChange={e => setNewTx({...newTx, vendor: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                <input type="number" placeholder="Amount ($)" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                <select value={newTx.category_code} onChange={e => setNewTx({...newTx, category_code: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
                  <option value={0}>Office Supplies</option>
                  <option value={1}>Travel</option>
                  <option value={2}>Meals</option>
                  <option value={3}>Misc</option>
                </select>
                <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition font-bold shadow-md hover:shadow-lg">Audit with Isolation Forest</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Live Audit Ledger</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider text-xs">
                      <tr><th className="px-6 py-4">Vendor</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">AI Audit Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-semibold text-slate-700">{tx.vendor}</td>
                          <td className="px-6 py-4 text-slate-600">${tx.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            {tx.is_anomaly ? <span className="text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 flex w-fit items-center shadow-sm"><AlertTriangle size={14} className="mr-1.5"/> Flagged for Audit</span> : <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200 flex w-fit items-center shadow-sm"><CheckCircle size={14} className="mr-1.5"/> Approved</span>}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-medium">No transactions logged yet.</td></tr>}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: VENDOR RISK (RANDOM FOREST) --- */}
        {activeTab === 'vendor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Vendor Risk Assessment</h2>
              <p className="text-gray-500 mb-8">Experiment 3: Run Random Forest classification on vendor history to prevent paying high-risk suppliers in advance.</p>
              
              <form onSubmit={submitVendorRisk} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700">Average Delivery Delay (Days)</label>
                  <p className="text-xs text-gray-400 mb-2">How many days late are they usually?</p>
                  <input type="number" step="0.1" value={vendorData.delay_days} onChange={e => setVendorData({...vendorData, delay_days: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Product Defect Rate</label>
                  <p className="text-xs text-gray-400 mb-2">Enter as a decimal (e.g. 0.05 for 5% defective items)</p>
                  <input type="number" step="0.01" value={vendorData.defect_rate} onChange={e => setVendorData({...vendorData, defect_rate: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Number of Past Financial Disputes</label>
                  <p className="text-xs text-gray-400 mb-2">How many times have you had to dispute an invoice?</p>
                  <input type="number" value={vendorData.past_disputes} onChange={e => setVendorData({...vendorData, past_disputes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition font-bold shadow-md hover:shadow-lg text-lg">Run Classification Model</button>
              </form>
            </div>
            
            <div className="flex flex-col">
              {vendorResult ? (
                <div className={`p-10 rounded-2xl shadow-lg border h-full flex flex-col items-center justify-center text-center transition-all ${vendorResult.is_risky ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-widest text-opacity-80">AI Trust Score</h3>
                  <div className={`text-8xl font-black mb-6 drop-shadow-sm ${vendorResult.is_risky ? 'text-red-600' : 'text-green-600'}`}>
                    {vendorResult.credit_score}<span className="text-3xl text-gray-400 opacity-50">/100</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mb-4">{vendorResult.is_risky ? 'High Risk Vendor' : 'Reliable Vendor'}</p>
                  <p className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider ${vendorResult.is_risky ? 'bg-red-200 text-red-900 shadow-sm' : 'bg-green-200 text-green-900 shadow-sm'}`}>{vendorResult.recommendation}</p>
                </div>
              ) : (
                <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-12 text-center text-gray-400 bg-slate-50">
                  <p className="text-lg font-medium">Enter vendor metrics and run the Random Forest model to generate a risk score.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: MARKET NLP (BERT) --- */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Financial News Sentiment</h2>
              <p className="text-gray-500 mb-8">Experiment 4: Process unstructured text using a HuggingFace BERT Neural Network to determine market sentiment.</p>
              
              <form onSubmit={submitNlp} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Paste Financial Headline or Tweet</label>
                  <textarea rows="5" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g., Global supply chain disruptions expected to severely impact tech hardware profits in Q3..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 outline-none transition text-slate-700" required />
                </div>
                <button type="submit" disabled={loadingNlp} className={`w-full text-white p-4 rounded-xl transition font-bold shadow-md hover:shadow-lg text-lg flex justify-center items-center ${loadingNlp ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  {loadingNlp ? <><Activity className="animate-spin mr-2" size={20}/> Analyzing Text...</> : "Run NLP Pipeline"}
                </button>
              </form>
            </div>
            
            <div className="flex flex-col">
              {nlpResult ? (
                <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col justify-center relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${nlpResult.sentiment === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  
                  <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-8">BERT Pipeline Output</p>
                  
                  <div className="space-y-8 z-10">
                    <div>
                      <p className="text-sm text-gray-500 mb-3 font-medium">Detected Sentiment Context</p>
                      <span className={`px-6 py-3 rounded-xl text-2xl font-black tracking-wide shadow-sm border ${nlpResult.sentiment === 'POSITIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {nlpResult.sentiment}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-sm text-gray-500 font-medium">Neural Network Confidence</p>
                        <span className="font-black text-slate-800 text-xl">{nlpResult.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 shadow-inner overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ease-out ${nlpResult.sentiment === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${nlpResult.confidence}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium">System Recommendation</p>
                      <p className="text-slate-700 font-medium">
                        {nlpResult.sentiment === 'POSITIVE' 
                          ? "This news indicates a bullish environment. Consider ignoring minor bearish signals in the ARIMA forecast." 
                          : "This news indicates high market risk. Re-evaluate any automated buy orders generated by mathematical models."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-12 text-center text-gray-400 bg-slate-50">
                   <p className="text-lg font-medium">Paste a news article and run the NLP pipeline to detect market sentiment.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;