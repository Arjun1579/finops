import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

function App() {
  // State Management
  const [forecastData, setForecastData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ vendor: '', amount: '', category_code: 0 });
  const [activeTab, setActiveTab] = useState('treasury');
  const [stockForecast, setStockForecast] = useState(null);

  // Fetch Data on Load
  useEffect(() => {
    fetchForecast();
    fetchTransactions();
  }, []);

  const fetchForecast = async () => {
    try {
      // Fetching the REAL yfinance data from your backend
      const res = await axios.get(`${API_BASE}/invest/forecast`);
      setStockForecast(res.data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
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
    try {
      await axios.post(`${API_BASE}/transactions`, {
        vendor: newTx.vendor,
        amount: parseFloat(newTx.amount),
        category_code: parseInt(newTx.category_code)
      });
      setNewTx({ vendor: '', amount: '', category_code: 0 }); // Reset form
      fetchTransactions(); // Refresh table
    } catch (error) {
      console.error("Error submitting transaction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">FinOps.ai Dashboard</h1>
        <p className="text-gray-500">Corporate Treasury & ML Risk Management</p>
      </header>

      {/* KPI Stat Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-medium">Current Liquidity</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$84,520</p>
          <p className="text-sm text-green-600 mt-2">+2.4% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 font-medium">Anomalies Blocked (ML)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{transactions.filter(t => t.is_anomaly).length}</p>
          <p className="text-sm text-gray-500 mt-2">Requires manual review</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-purple-500">
          <p className="text-sm text-gray-500 font-medium">Active AI Models</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">2</p>
          <p className="text-sm text-gray-500 mt-2">ARIMA, Isolation Forest</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('treasury')} 
          className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'treasury' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Treasury & Cash Flow (Exp 1)
        </button>
        <button 
          onClick={() => setActiveTab('audit')} 
          className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'audit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          AI Expense Audit (Exp 6)
        </button>
        <button 
          onClick={() => setActiveTab('vendor')} 
          className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'vendor' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Vendor Risk (V2 Pitch - Exp 3)
        </button>
        <button 
          onClick={() => setActiveTab('market')} 
          className={`pb-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'market' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Market Intel (V2 Pitch - Exp 4)
        </button>
      </div>

      {/* --- TAB 1: REAL STOCK MARKET FORECAST (Exp 1) --- */}
      {activeTab === 'treasury' && stockForecast && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Corporate Investment Forecast (ARIMA)</h2>
              <p className="text-sm text-gray-500">Predicting {stockForecast.ticker} (S&P 500) based on live yfinance data</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Market Price</p>
              <p className="text-2xl font-bold text-green-600">${stockForecast.current_price}</p>
            </div>
          </div>
          
          <div className="h-96 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockForecast.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                
                {/* Blue line for actual past prices */}
                <Line type="monotone" dataKey="actual_price" name="Historical Price" stroke="#1F2937" strokeWidth={3} dot={true} />
                
                {/* Dashed orange line for AI predictions */}
                <Line type="monotone" dataKey="predicted_price" name="AI Forecast" stroke="#F97316" strokeWidth={3} strokeDasharray="5 5" dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- TAB 2: AI AUDIT (Isolation Forest Form & Table) --- */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Log Petty Cash Expense</h2>
            <form onSubmit={submitTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                <input type="text" value={newTx.vendor} onChange={e => setNewTx({...newTx, vendor: e.target.value})} className="mt-1 w-full p-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="mt-1 w-full p-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={newTx.category_code} onChange={e => setNewTx({...newTx, category_code: e.target.value})} className="mt-1 w-full p-2 border rounded-md">
                  <option value={0}>Office Supplies</option>
                  <option value={1}>Travel</option>
                  <option value={2}>Meals</option>
                  <option value={3}>Misc</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition font-medium">
                Submit to ML Audit
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Audit Ledger (Isolation Forest)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="uppercase tracking-wider border-b-2 border-gray-100 text-gray-600">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">AI Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">#{tx.id}</td>
                      <td className="px-6 py-4 font-medium">{tx.vendor}</td>
                      <td className="px-6 py-4 font-mono">${tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {tx.is_anomaly ? (
                          <span className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full w-max">
                            <AlertTriangle size={16} className="mr-2" /> Flagged for Audit
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full w-max">
                            <CheckCircle size={16} className="mr-2" /> Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No transactions logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: VENDOR RISK (V2 Pitch - Exp 3 Classification) --- */}
      {activeTab === 'vendor' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Vendor Credit Risk Assessment</h2>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">Random Forest Model (Upcoming)</span>
          </div>
          <p className="text-gray-600 mb-6">This module will use historical invoice data and delivery metrics to classify vendor reliability before issuing payments.</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg border-l-4 border-l-green-500 bg-green-50/10">
               <div>
                 <p className="font-bold text-gray-900">Global Tech Supplies</p>
                 <p className="text-sm text-gray-500">Historical Default Rate: 1.2% | On-time Delivery: 98%</p>
               </div>
               <div className="text-right">
                 <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium text-sm inline-block mb-1">Low Risk (Score: 92/100)</span>
               </div>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg border-l-4 border-l-red-500 bg-red-50/30">
               <div>
                 <p className="font-bold text-gray-900">Apex Logistics Co.</p>
                 <p className="text-sm text-gray-500">Historical Default Rate: 14.5% | Recent Disputes: 3</p>
               </div>
               <div className="text-right">
                 <span className="text-red-700 bg-red-100 px-3 py-1 rounded-full font-medium text-sm flex items-center justify-end gap-1 mb-1">
                   High Risk (Score: 45/100)
                 </span>
                 <p className="text-xs text-red-500 font-medium mt-1">Warning: Do not advance cash</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: MARKET INTEL (V2 Pitch - Exp 4 NLP) --- */}
      {activeTab === 'market' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Market Intelligence Feed</h2>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">BERT NLP Sentiment (Upcoming)</span>
          </div>
          <p className="text-gray-600 mb-6">This module will scrape daily financial news and use NLP to gauge market sentiment, adjusting our cash flow models accordingly.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg border-l-4 border-l-red-500 bg-red-50/20">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Negative Sentiment</span>
              <h3 className="font-bold text-gray-900 mt-3">Global shipping rates expected to rise 15% due to port strikes</h3>
              <p className="text-sm text-gray-600 mt-2">AI Suggestion: Increase 'Logistics' expense budget in ARIMA forecast by 15% for Q3.</p>
            </div>
            <div className="p-4 border rounded-lg border-l-4 border-l-green-500 bg-green-50/20">
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">Positive Sentiment</span>
              <h3 className="font-bold text-gray-900 mt-3">Tech sector hardware costs hit 2-year low</h3>
              <p className="text-sm text-gray-600 mt-2">AI Suggestion: Favorable time to execute planned server upgrades. Sufficient liquidity detected.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;