import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { SalesData, WorkflowStatus } from './types';
import SalesPlanningForm from './components/SalesPlanningForm';
import WorkflowControls from './components/WorkflowControls';
import ReviewPage from './components/ReviewPage';
import './App.css';

const MainPage: React.FC = () => {
  const location = useLocation();
  
  const [salesData, setSalesData] = useState<SalesData>({
    country: '',
    rows: [{
      id: '1',
      quarter: 'Q1',
      hfb: '',
      turnover: '',
      profit: '',
      qty: '',
      gm: ''
    }]
  });

  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft');

  // Handle data from navigation state (when returning from review page)
  useEffect(() => {
    if (location.state) {
      const { status, salesData: navSalesData } = location.state as any;
      if (status) setWorkflowStatus(status);
      if (navSalesData) setSalesData(navSalesData);
    }
  }, [location.state]);

  const handleDataChange = (data: SalesData) => {
    setSalesData(data);
  };

  const handleStatusChange = (status: WorkflowStatus) => {
    setWorkflowStatus(status);
  };

  const handleDataReset = () => {
    setSalesData({
      country: '',
      rows: [{
        id: '1',
        quarter: 'Q1',
        hfb: '',
        turnover: '',
        profit: '',
        qty: '',
        gm: ''
      }]
    });
  };

  const isDataValid = () => {
    if (!salesData.country.trim()) return false;
    return salesData.rows.every(row => 
      row.hfb.trim() !== '' && 
      row.turnover.trim() !== '' && 
      row.profit.trim() !== '' && 
      row.qty.trim() !== '' && 
      row.gm.trim() !== ''
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>IKEA Sales Planning</h1>
      </header>
      <main className="app-main">
        <SalesPlanningForm
          data={salesData}
          onDataChange={handleDataChange}
          isReadOnly={workflowStatus === 'published'}
        />
        <WorkflowControls
          currentStatus={workflowStatus}
          onStatusChange={handleStatusChange}
          isDataValid={isDataValid()}
          salesData={salesData}
          onDataReset={handleDataReset}
        />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/review" element={<ReviewPage />} />
      </Routes>
    </Router>
  );
};

export default App;