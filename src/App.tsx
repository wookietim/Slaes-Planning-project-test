import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SalesData, WorkflowStatus } from './types';
import apiService from './services/apiService';
import SalesPlanningForm from './components/SalesPlanningForm';
import WorkflowControls from './components/WorkflowControls';
import ReviewPage from './components/ReviewPage';
import LoginPage from './components/LoginPage';
import DataManagementPage from './components/DataManagementPage';
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
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  // Handle data from navigation state (when returning from review page)
  useEffect(() => {
    if (location.state) {
      const { status, salesData: navSalesData, entryId } = location.state as any;
      if (status) setWorkflowStatus(status);
      if (navSalesData) setSalesData(navSalesData);
      if (entryId) setCurrentEntryId(entryId);
    }
  }, [location.state]);

  const handleDataChange = async (data: SalesData) => {
    setSalesData(data);
    // Auto-save to database when data changes
    if (currentEntryId) {
      try {
        await apiService.updateSalesPlan(currentEntryId, {
          country: data.country,
          status: workflowStatus,
          rows: data.rows.map(row => ({
            quarter: row.quarter,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0
          }))
        });
      } catch (error) {
        console.error('Failed to auto-save data:', error);
      }
    }
  };

  const handleStatusChange = async (status: WorkflowStatus) => {
    setWorkflowStatus(status);
    
    // Save to database when status changes
    if (currentEntryId) {
      try {
        await apiService.updateSalesPlan(currentEntryId, {
          country: salesData.country,
          status: status,
          rows: salesData.rows.map(row => ({
            quarter: row.quarter,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0
          }))
        });
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    } else {
      // Create new entry if it doesn't exist
      try {
        const result = await apiService.createSalesPlan({
          country: salesData.country,
          status: status,
          rows: salesData.rows.map(row => ({
            quarter: row.quarter,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0
          }))
        });
        setCurrentEntryId(result.id);
      } catch (error) {
        console.error('Failed to create sales plan:', error);
      }
    }
  };

  const handleDataReset = () => {
    const newData = {
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
    };
    setSalesData(newData);
    setWorkflowStatus('draft');
    setCurrentEntryId(null);
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
        <nav className="app-nav">
          <a href="/data" className="nav-link">📊 View Saved Data</a>
        </nav>
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
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/data" element={<DataManagementPage />} />
      </Routes>
    </Router>
  );
};

export default App;