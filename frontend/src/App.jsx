import React from 'react';
import TreasuryModule from './components/TreasuryModule';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* This is the main shell for your Final Year Project. 
        Later, you can add navigation here to switch between:
        - General Ledger (P&L, Cashflow)
        - Salary & Payroll
        - AI Treasury Module (Below)
      */}
      
      <TreasuryModule />
    </div>
  );
}

export default App;