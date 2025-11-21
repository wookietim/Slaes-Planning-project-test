import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { SalesData, WorkflowStatus } from './types';
import apiService, { SalesPlan } from './services/apiService';
import SalesPlanningForm from './components/SalesPlanningForm.tsx';
import WorkflowControls from './components/WorkflowControls.tsx';
import ReviewPage from './components/ReviewPage.tsx';
import PublishedPage from './components/PublishedPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import DataManagementPage from './components/DataManagementPage.tsx';
import AdminPage from './AdminPage.tsx';
import DateTimeWeatherWidget from './components/DateTimeWeatherWidget.tsx';
import './App.css';

// Route protection component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'inputUser' | 'reviewer' | 'admin';
  allowAny?: boolean;
}> = ({ children, requiredRole, allowAny }) => {
  const currentUser = localStorage.getItem('currentUser');
  console.log('ProtectedRoute - currentUser:', currentUser, 'requiredRole:', requiredRole);
  
  if (!currentUser) {
    console.log('No current user - redirecting to login');
    return <Navigate to="/" replace />;
  }

  if (allowAny) {
    console.log('Allow any - granting access');
    return <>{children}</>;
  }

  const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
    const userRoles = localStorage.getItem('userRoles');
    
    // Special case for timothy.collins - allow admin access even without initialized roles
    if (!userRoles && currentUser === 'timothy.collins@ingka.ikea.com' && role === 'admin') {
      console.log('Timothy Collins special case - granting admin access');
      return true;
    }
    
    if (!userRoles) {
      console.log('No user roles found');
      return false;
    }
    
    try {
      const roles = JSON.parse(userRoles);
      const hasRole = roles[currentUser]?.[role] || false;
      console.log(`User ${currentUser} has role ${role}:`, hasRole);
      return hasRole;
    } catch (error) {
      console.error('Failed to parse user roles:', error);
      return false;
    }
  };

  if (requiredRole && !checkUserRole(requiredRole)) {
    console.log('User does not have required role, checking alternatives...');
    // Redirect to appropriate page based on their actual role
    const isInputUser = checkUserRole('inputUser');
    const isReviewer = checkUserRole('reviewer');
    const isAdmin = checkUserRole('admin');
    
    console.log('User roles check:', { isInputUser, isReviewer, isAdmin });
    
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else if (isInputUser) {
      return <Navigate to="/main" replace />;
    } else if (isReviewer) {
      return <Navigate to="/review" replace />;
    } else {
      return <Navigate to="/published" replace />;
    }
  }

  console.log('Access granted to protected route');
  return <>{children}</>;
};

const MainPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if current user has reviewer role
  const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
    // Special case for timothy.collins - always grant admin access
    if (currentUser === 'timothy.collins@ingka.ikea.com' && role === 'admin') {
      return true;
    }
    
    // Special case for timothy.collins - grant all roles
    if (currentUser === 'timothy.collins@ingka.ikea.com') {
      return true;
    }
    
    const userRoles = localStorage.getItem('userRoles');
    if (!userRoles) return false;
    
    try {
      const roles = JSON.parse(userRoles);
      return roles[currentUser]?.[role] || false;
    } catch (error) {
      console.error('Failed to parse user roles:', error);
      return false;
    }
  };

  const isReviewer = checkUserRole('reviewer');
  const isInputUser = checkUserRole('inputUser');
  const isAdmin = checkUserRole('admin');
  
  const [salesData, setSalesData] = useState<SalesData>({
    country: '',
    year: '2026',
    rows: [{
      id: '1',
      planningPeriod: 'FY',
      hfb: '',
      turnover: '',
      profit: '',
      qty: '',
      gm: ''
    }]
  });

  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft');
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [existingPlans, setExistingPlans] = useState<SalesPlan[]>([]);
  const [rowStatuses, setRowStatuses] = useState<Record<string, 'pending' | 'approved' | 'denied'>>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [showResetDbModal, setShowResetDbModal] = useState(false);

  // Filter states for existing plans table
  const [filters, setFilters] = useState({
    year: '', // Empty to show all years by default
    country: '',
    hfb: '',
    status: ''
  });

  // Load row statuses from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem('reviewRowStatuses');
    if (savedStatuses) {
      try {
        setRowStatuses(JSON.parse(savedStatuses));
      } catch (error) {
        console.error('Failed to parse saved row statuses:', error);
      }
    }
  }, []);

  // Listen for changes to localStorage (when ReviewPage updates statuses)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedStatuses = localStorage.getItem('reviewRowStatuses');
      if (savedStatuses) {
        try {
          setRowStatuses(JSON.parse(savedStatuses));
        } catch (error) {
          console.error('Failed to parse saved row statuses:', error);
        }
      }
    };

    // Listen for storage changes from other components
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(() => {
      const currentStatuses = localStorage.getItem('reviewRowStatuses');
      if (currentStatuses) {
        try {
          const parsed = JSON.parse(currentStatuses);
          setRowStatuses(prev => {
            // Only update if there are actual changes
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
        } catch (error) {
          console.error('Failed to parse saved row statuses:', error);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Load existing plans on component mount
  useEffect(() => {
    loadExistingPlans();
  }, []);

  const loadExistingPlans = async () => {
    try {
      const plans = await apiService.getAllSalesPlans();
      const currentUser = localStorage.getItem('currentUser');
      
      // Filter plans to only show entries for the current user
      const userPlans = currentUser 
        ? plans.filter(plan => plan.user === currentUser)
        : plans;
      
      setExistingPlans(userPlans);
    } catch (error) {
      console.error('Failed to load existing plans:', error);
    }
  };

  // Handle data from navigation state (when returning from review page)
  useEffect(() => {
    if (location.state) {
      const { status, salesData: navSalesData, entryId, fromReview } = location.state as any;
      
      // If coming from review page, always start fresh
      if (fromReview) {
        handleDataReset();
        return;
      }
      
      // Otherwise, load the navigation data
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
          year: data.year,
          status: workflowStatus,
          rows: data.rows.map(row => ({
            planningPeriod: row.planningPeriod,
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      
      if (currentEntryId) {
        // Update existing entry
        await apiService.updateSalesPlan(currentEntryId, {
          country: salesData.country,
          year: salesData.year,
          status: workflowStatus,
          user: currentUser || undefined,
          rows: salesData.rows.map(row => ({
            planningPeriod: row.planningPeriod,
            hfb: row.hfb,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0,
            qty: parseFloat(row.qty) || 0
          }))
        });
        setSaveMessage('✅ Changes saved successfully!');
      } else {
        // Create new entry
        const result = await apiService.createSalesPlan({
          country: salesData.country,
          year: salesData.year,
          status: workflowStatus,
          user: currentUser || undefined,
          rows: salesData.rows.map(row => ({
            planningPeriod: row.planningPeriod,
            hfb: row.hfb,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0,
            qty: parseFloat(row.qty) || 0
          }))
        });
        setCurrentEntryId(result.id);
        setSaveMessage('✅ Data saved successfully!');
      }
      
      // Reload plans
      await loadExistingPlans();
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save data:', error);
      setSaveMessage('❌ Failed to save. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Validation function to check if all required fields are filled
  const validateFormData = (data: SalesData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if country is selected
    if (!data.country || data.country.trim() === '') {
      errors.push('Country must be selected');
    }

    // Check if there are any rows
    if (!data.rows || data.rows.length === 0) {
      errors.push('At least one row must be added');
    } else {
      // Check each row for required fields
      data.rows.forEach((row, index) => {
        const rowNumber = index + 1;

        // Check HFB
        if (!row.hfb || row.hfb.trim() === '') {
          errors.push(`Row ${rowNumber}: HFB must be filled`);
        }

        // Check Planning Period
        if (!row.planningPeriod || row.planningPeriod.trim() === '') {
          errors.push(`Row ${rowNumber}: Planning Period must be filled`);
        }

        // Check Turnover (Sales Goal)
        if (!row.turnover || row.turnover.trim() === '' || isNaN(parseFloat(row.turnover))) {
          errors.push(`Row ${rowNumber}: Turnover must be a valid number`);
        }

        // Check Profit (Actual Sales)
        if (!row.profit || row.profit.trim() === '' || isNaN(parseFloat(row.profit))) {
          errors.push(`Row ${rowNumber}: Profit must be a valid number`);
        }

        // Check Qty
        if (!row.qty || row.qty.trim() === '' || isNaN(parseFloat(row.qty))) {
          errors.push(`Row ${rowNumber}: Qty must be a valid number`);
        }

        // Check GM (Variance)
        if (!row.gm || row.gm.trim() === '' || isNaN(parseFloat(row.gm))) {
          errors.push(`Row ${rowNumber}: GM must be a valid number`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleStatusChange = async (status: WorkflowStatus) => {
    // Validate form data before proceeding
    const validation = validateFormData(salesData);
    if (!validation.isValid) {
      const errorMessage = "Please fix the following issues before proceeding:\n\n" + 
        validation.errors.map(error => `• ${error}`).join('\n');
      alert(errorMessage);
      return;
    }

    setWorkflowStatus(status);
    const currentUser = localStorage.getItem('currentUser');
    
    // Save to database when status changes
    if (currentEntryId) {
      try {
        await apiService.updateSalesPlan(currentEntryId, {
          country: salesData.country,
          year: salesData.year,
          status: status,
          user: currentUser || undefined,
          rows: salesData.rows.map(row => ({
            planningPeriod: row.planningPeriod,
            hfb: row.hfb,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0,
            qty: parseFloat(row.qty) || 0
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
          year: salesData.year,
          status: status,
          user: currentUser || undefined,
          rows: salesData.rows.map(row => ({
            planningPeriod: row.planningPeriod,
            hfb: row.hfb,
            salesGoal: parseFloat(row.turnover) || 0,
            actualSales: parseFloat(row.profit) || 0,
            variance: parseFloat(row.gm) || 0,
            qty: parseFloat(row.qty) || 0
          }))
        });
        setCurrentEntryId(result.id);
        loadExistingPlans(); // Refresh the plans list
      } catch (error) {
        console.error('Failed to create sales plan:', error);
      }
    }
    loadExistingPlans(); // Refresh the plans list after any status change
  };

  const handleDataReset = () => {
    const newData = {
      country: '',
      year: '2025',
      rows: [{
        id: '1',
        planningPeriod: 'FY',
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

  const handleEditDeniedRow = (planId: string, rowIndex: number, row: any) => {
    const rowKey = `${planId}-${rowIndex}`;
    setEditingRowId(rowKey);
    setEditingData({
      salesGoal: row.salesGoal,
      actualSales: row.actualSales,
      variance: row.variance
    });
  };

  const handleSaveInlineEdit = async (planId: string, rowIndex: number) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      
      // Get the full plan to update
      const plan = existingPlans.find(p => p.id === planId);
      if (!plan) return;

      // Update the specific row
      const updatedRows = [...plan.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        salesGoal: editingData.salesGoal,
        actualSales: editingData.actualSales,
        variance: editingData.variance,
        qty: editingData.qty
      };

      // Update the plan in the database
      await apiService.updateSalesPlan(planId, {
        ...plan,
        user: currentUser || undefined,
        rows: updatedRows
      });

      // Reset the row status to pending
      const rowKey = `${planId}-${rowIndex}`;
      const savedStatuses = localStorage.getItem('reviewRowStatuses');
      if (savedStatuses) {
        const statuses = JSON.parse(savedStatuses);
        statuses[rowKey] = 'pending';
        localStorage.setItem('reviewRowStatuses', JSON.stringify(statuses));
        setRowStatuses(statuses);
      }

      // Exit edit mode
      setEditingRowId(null);
      setEditingData({});
      
      // Reload plans to show updated data
      await loadExistingPlans();
      
      alert('Row updated and resubmitted for review!');
    } catch (error) {
      console.error('Failed to save row edit:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const handleEditFieldChange = (field: string, value: string) => {
    setEditingData((prev: any) => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Get unique values for filter dropdowns
  const getFilterOptions = () => {
    // Fixed year range from 2020 to 2025
    const years = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());
    
    // Fixed country options to match form dropdown exactly
    const countries = ['USA', 'Sweden', 'France', 'Mexico'];
    
    const planStatuses = [...new Set(existingPlans.map(plan => plan.status))].sort();
    const hfbOptions = ['HFB 01 Living room seating', 'HFB 02 Store and organise furniture', 'HFB 03 Workspaces', 'HFB 04 Bedroom furniture', 'HFB 05 Beds & Mattresses', 'HFB 06 Bathroom', 'HFB 07 Kitchen']; // New HFB options
    
    // Get row-level statuses including pending
    const rowStatusOptions = ['pending', 'approved', 'denied', 'published'];
    
    return { years, countries, planStatuses, hfbOptions, rowStatusOptions };
  };

  // Filter existing plans based on filter criteria
  const getFilteredPlans = () => {
    return existingPlans.filter(plan => {
      if (filters.year && plan.year !== filters.year) return false;
      if (filters.country && plan.country !== filters.country) return false;
      // HFB filter would apply here when we have actual HFB data
      
      // For row status filter, check if any row in the plan has the selected status
      if (filters.status) {
        const hasMatchingRowStatus = plan.rows.some((_, index) => {
          const rowKey = `${plan.id}-${index}`;
          const rowStatus = rowStatuses[rowKey] || 'pending';
          return rowStatus === filters.status;
        });
        if (!hasMatchingRowStatus) return false;
      }
      
      return true;
    });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      country: '',
      hfb: '',
      status: ''
    });
  };

  const handleResubmitRow = (planId: string, rowIndex: number) => {
    // Reset the row status to pending and remove it from localStorage
    const rowKey = `${planId}-${rowIndex}`;
    
    // Update localStorage
    const savedStatuses = localStorage.getItem('reviewRowStatuses');
    if (savedStatuses) {
      try {
        const statuses = JSON.parse(savedStatuses);
        statuses[rowKey] = 'pending';
        localStorage.setItem('reviewRowStatuses', JSON.stringify(statuses));
        
        // Update local state
        setRowStatuses(statuses);
        
        // Show success message
        alert('Row has been resubmitted for review and will appear in the review queue.');
      } catch (error) {
        console.error('Failed to update row status:', error);
        alert('Failed to resubmit row. Please try again.');
      }
    }
  };

  const handleEditPlan = (plan: SalesPlan) => {
    // Convert the plan data to the form format
    const formData: SalesData = {
      country: plan.country,
      year: plan.year,
      rows: plan.rows.map((row, index) => ({
        id: `${plan.id}-${index}`,
        planningPeriod: row.planningPeriod || row.quarter || 'FY',
        hfb: row.hfb || '',
        turnover: row.salesGoal.toString(),
        profit: row.actualSales.toString(),
        qty: row.qty?.toString() || '',
        gm: row.variance.toString()
      }))
    };

    // Load the data into the form
    setSalesData(formData);
    // Set status to draft to make it editable, unless it's already denied
    setWorkflowStatus(plan.status === 'denied' ? 'denied' : 'draft');
    setCurrentEntryId(plan.id);

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSampleData = async () => {
    if (!confirm('This will delete all existing data and load sample data. Are you sure?')) {
      return;
    }

    try {
      // First, delete all existing data
      const deleteResponse = await fetch('http://localhost:3001/api/sales-plans', {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing data');
      }

      // Sample data for USA and Sweden, 2024 and 2025, with new HFB values
      const sampleData = [
        // USA 2025
        {
          country: "USA",
          year: "2025",
          status: "review",
          user: "timothy.collins@ingka.ikea.com",
          rows: [
            {"planningPeriod": "FY", "hfb": "HFB 01 Living room seating", "salesGoal": 180000, "actualSales": 175000, "variance": -5000, "qty": 720},
            {"planningPeriod": "FY", "hfb": "HFB 02 Store and organise furniture", "salesGoal": 200000, "actualSales": 210000, "variance": 10000, "qty": 800},
            {"planningPeriod": "FY", "hfb": "HFB 03 Workspaces", "salesGoal": 190000, "actualSales": 195000, "variance": 5000, "qty": 760}
          ]
        },
        // USA 2025
        {
          country: "USA",
          year: "2025", 
          status: "review",
          user: "timothy.collins@ingka.ikea.com",
          rows: [
            {"planningPeriod": "T1", "hfb": "HFB 01 Living room seating", "salesGoal": 220000, "actualSales": 215000, "variance": -5000, "qty": 880},
            {"planningPeriod": "T1", "hfb": "HFB 02 Store and organise furniture", "salesGoal": 240000, "actualSales": 250000, "variance": 10000, "qty": 960},
            {"planningPeriod": "T1", "hfb": "HFB 03 Workspaces", "salesGoal": 230000, "actualSales": 235000, "variance": 5000, "qty": 920}
          ]
        },
        // Sweden 2024
        {
          country: "USA",
          year: "2025",
          status: "review", 
          user: "timothy.collins@ingka.ikea.com",
          rows: [
            {"planningPeriod": "T2", "hfb": "HFB 01 Living room seating", "salesGoal": 150000, "actualSales": 145000, "variance": 5000, "qty": 580},
            {"planningPeriod": "T2", "hfb": "HFB 02 Store and organise furniture", "salesGoal": 160000, "actualSales": 170000, "variance": 10000, "qty": 640},
            {"planningPeriod": "T2", "hfb": "HFB 03 Workspaces", "salesGoal": 155000, "actualSales": 160000, "variance": 5000, "qty": 620}
          ]
        },
        // Sweden 2025
        {
          country: "USA",
          year: "2025",
          status: "review",
          user: "timothy.collins@ingka.ikea.com",
          rows: [
            {"planningPeriod": "T3", "hfb": "HFB 01 Living room seating", "salesGoal": 170000, "actualSales": 165000, "variance": -5000, "qty": 680},
            {"planningPeriod": "T3", "hfb": "HFB 02 Store and organise furniture", "salesGoal": 180000, "actualSales": 190000, "variance": 10000, "qty": 720},
            {"planningPeriod": "T3", "hfb": "HFB 03 Workspaces", "salesGoal": 175000, "actualSales": 180000, "variance": 5000, "qty": 700}
          ]
        }
      ];

      // Create each sample plan
      for (const plan of sampleData) {
        const response = await fetch('http://localhost:3001/api/sales-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(plan)
        });

        if (!response.ok) {
          throw new Error(`Failed to create ${plan.country} ${plan.year} plan`);
        }
      }

      // Clear row statuses (reset to pending)
      localStorage.removeItem('reviewRowStatuses');
      setRowStatuses({});

      // Reset the form to empty state
      setSalesData({
        country: '',
        year: '2025',
        rows: [{
          id: '1',
          planningPeriod: 'FY',
          hfb: '',
          turnover: '',
          profit: '',
          qty: '',
          gm: ''
        }]
      });
      setCurrentEntryId(null);

      // Refresh the plans list
      await loadExistingPlans();
      
      alert('Sample data loaded successfully! 4 plans created for USA and Sweden (2024 & 2025) with Sales HFB.');
    } catch (error) {
      console.error('Failed to load sample data:', error);
      alert('Failed to load sample data. Please check the console for details.');
    }
  };

  const handleResetDatabase = async () => {
    try {
      await apiService.clearAllData();
      
      // Clear row statuses
      localStorage.removeItem('reviewRowStatuses');
      setRowStatuses({});

      // Reset the form to empty state
      setSalesData({
        country: '',
        year: '2025',
        rows: [{
          id: '1',
          planningPeriod: 'FY',
          hfb: '',
          turnover: '',
          profit: '',
          qty: '',
          gm: ''
        }]
      });
      setCurrentEntryId(null);
      setWorkflowStatus('draft');

      // Refresh the plans list
      await loadExistingPlans();
      
      setShowResetDbModal(false);
      alert('Database cleared successfully! All plans have been deleted.');
    } catch (error) {
      console.error('Failed to clear database:', error);
      alert('Failed to clear database. Please check the console for details.');
    }
  };

  const isDataValid = () => {
    return validateFormData(salesData).isValid;
  };

  return (
    <div className="app">
      <DateTimeWeatherWidget />
      <header className="app-header">
        <h1>IKEA Sales Planning</h1>
        
        {/* Tab Navigation */}
        <nav className="app-tabs">
          <div className="tab-container">
            {isInputUser && (
              <button className="tab active">
                📋 Main
              </button>
            )}
            {isReviewer && (
              <button 
                className="tab"
                onClick={() => navigate('/review')}
              >
                📝 Review
              </button>
            )}
            <button 
              className="tab"
              onClick={() => navigate('/published')}
            >
              📊 Published
            </button>
            {isAdmin && (
              <button 
                className="tab"
                onClick={() => navigate('/admin')}
              >
                🔧 Admin
              </button>
            )}
          </div>
          
          {/* Action buttons moved to a separate section */}
          <div className="app-actions">
            <button 
              className="btn reset-btn"
              onClick={handleDataReset}
              title="Reset form and start fresh"
            >
              🔄 Reset Form
            </button>
            <button
              className="btn reset-db-btn"
              onClick={() => setShowResetDbModal(true)}
              title="Clear all plans from database"
            >
              🗑️ Reset DB
            </button>
            <button
              className="btn sample-data-btn"
              onClick={handleLoadSampleData}
              title="Load sample data (clears existing data)"
            >
              📦 Load Sample Data
            </button>
          </div>
        </nav>
      </header>
      
      <main className="app-main">
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}
        <SalesPlanningForm
          data={salesData}
          onDataChange={handleDataChange}
          isReadOnly={workflowStatus === 'review' || workflowStatus === 'approved' || workflowStatus === 'published'}
          onSave={handleSave}
          isSaving={isSaving}
          workflowControls={
            <WorkflowControls
              currentStatus={workflowStatus}
              onStatusChange={handleStatusChange}
              isDataValid={isDataValid()}
              salesData={salesData}
              onDataReset={handleDataReset}
              currentEntryId={currentEntryId}
            />
          }
        />
        
        {/* Existing Plans Display */}
        {existingPlans.length > 0 && (
          <div className="existing-plans-section">
            <h2>Entered Plans</h2>
            
            {/* Filter Controls */}
            <div className="plans-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Year:</label>
                  <select 
                    value={filters.year} 
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Years</option>
                    {getFilterOptions().years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Country:</label>
                  <select 
                    value={filters.country} 
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Countries</option>
                    {getFilterOptions().countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>HFB:</label>
                  <select 
                    value={filters.hfb} 
                    onChange={(e) => handleFilterChange('hfb', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All HFB</option>
                    {getFilterOptions().hfbOptions.map(hfb => (
                      <option key={hfb} value={hfb}>{hfb}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Row Status:</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Row Status</option>
                    {getFilterOptions().rowStatusOptions.map(status => (
                      <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="btn clear-filters-btn"
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            <div className="plans-table-container">
              {getFilteredPlans().length > 0 ? (
                getFilteredPlans()
                  .sort((a, b) => {
                    // Sort by year first
                    if (a.year !== b.year) return a.year.localeCompare(b.year);
                    // Then by country
                    if (a.country !== b.country) return a.country.localeCompare(b.country);
                    // Finally by planning period (sort rows within each plan)
                    return 0;
                  })
                  .map((plan) => {
                  // Sort rows within each plan by planning period
                  const sortedRows = [...plan.rows].sort((a, b) => 
                    (a.planningPeriod || a.quarter || 'T1').localeCompare(b.planningPeriod || b.quarter || 'T1')
                  );
                  
                  return (
                    <div key={plan.id} className="plan-entry">
                      <div className="plan-entry-header">
                        <div className="plan-info">
                          <span className="plan-country-year">{plan.country} ({plan.year})</span>
                          <span className="plan-created">Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="plan-actions">
                          <button
                            className="btn edit-plan-btn"
                            onClick={() => handleEditPlan(plan)}
                            title="Edit this plan"
                          >
                            ✏️ Edit Plan
                          </button>
                        </div>
                      </div>
                      
                      <div className="plan-data-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Planning Period</th>
                              <th>HFB</th>
                              <th>Turnover</th>
                              <th>Profit</th>
                              <th>Qty</th>
                              <th>GM</th>
                              <th>Row Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedRows
                              .map((row, index) => ({ row, index, rowKey: `${plan.id}-${index}` }))
                              .filter(({ rowKey }) => {
                                // If row status filter is active, only show rows with matching status
                                if (filters.status) {
                                  const rowStatus = rowStatuses[rowKey] || 'pending';
                                  return rowStatus === filters.status;
                                }
                                return true; // Show all rows if no status filter
                              })
                              .map(({ row, index, rowKey }) => {
                              const rowStatus = rowStatuses[rowKey] || 'pending';
                              const isEditing = editingRowId === rowKey;
                              
                              return (
                              <tr key={index} className={isEditing ? 'editing-row' : ''}>
                                <td>{row.planningPeriod || row.quarter || 'T1'}</td>
                                <td>{row.hfb || '-'}</td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editingData.salesGoal || row.salesGoal}
                                      onChange={(e) => handleEditFieldChange('salesGoal', e.target.value)}
                                      className="inline-edit-input"
                                    />
                                  ) : (
                                    row.salesGoal.toLocaleString()
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editingData.actualSales || row.actualSales}
                                      onChange={(e) => handleEditFieldChange('actualSales', e.target.value)}
                                      className="inline-edit-input"
                                    />
                                  ) : (
                                    row.actualSales.toLocaleString()
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editingData.qty || row.qty || ''}
                                      onChange={(e) => handleEditFieldChange('qty', e.target.value)}
                                      className="inline-edit-input"
                                    />
                                  ) : (
                                    row.qty !== undefined && row.qty !== null ? row.qty.toLocaleString() : '-'
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editingData.variance || row.variance}
                                      onChange={(e) => handleEditFieldChange('variance', e.target.value)}
                                      className="inline-edit-input"
                                    />
                                  ) : (
                                    <>
                                      {row.variance > 0 ? '+' : ''}{row.variance.toLocaleString()}
                                    </>
                                  )}
                                </td>
                                <td>
                                  <span className={`row-status-badge ${rowStatus}`}>
                                    {rowStatus.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  {isEditing ? (
                                    <div className="row-actions">
                                      <button 
                                        className="btn save-edit-btn"
                                        onClick={() => handleSaveInlineEdit(plan.id, index)}
                                        title="Save changes and resubmit"
                                      >
                                        ✅ Save
                                      </button>
                                      <button 
                                        className="btn cancel-edit-btn"
                                        onClick={handleCancelInlineEdit}
                                        title="Cancel editing"
                                      >
                                        ❌ Cancel
                                      </button>
                                    </div>
                                  ) : rowStatus === 'denied' ? (
                                    <div className="row-actions">
                                      <button 
                                        className="btn edit-row-btn"
                                        onClick={() => handleEditDeniedRow(plan.id, index, row)}
                                        title="Edit this denied row"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button 
                                        className="btn resubmit-row-btn"
                                        onClick={() => handleResubmitRow(plan.id, index)}
                                        title="Resubmit this row for review"
                                      >
                                        🔄 Resubmit
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="no-actions">-</span>
                                  )}
                                </td>
                              </tr>
                              );
                            })
                            .filter(Boolean)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-filtered-results">
                  <p>
                    {filters.status 
                      ? `No plans found with ${filters.status.toUpperCase()} rows matching the current criteria.`
                      : "No plans match the current filter criteria."
                    }
                  </p>
                  <button 
                    className="btn primary-btn"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Filter Results Count - moved to bottom */}
            <div className="filter-results">
              Showing {getFilteredPlans().length} of {existingPlans.length} plans
              {filters.status && (
                <span className="filter-applied"> (plans with {filters.status.toUpperCase()} rows)</span>
              )}
              {(filters.year || filters.country || filters.hfb) && !filters.status && (
                <span className="filter-applied"> (filtered)</span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reset Database Confirmation Modal */}
      {showResetDbModal && (
        <div className="modal-overlay" onClick={() => setShowResetDbModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirm Database Reset</h2>
            <p>Are you sure you want to clear all plans from the database?</p>
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button
                className="btn cancel-btn"
                onClick={() => setShowResetDbModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn danger-btn"
                onClick={handleResetDatabase}
              >
                Yes, Clear Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/main" 
          element={
            <ProtectedRoute requiredRole="inputUser">
              <MainPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/review" 
          element={
            <ProtectedRoute requiredRole="reviewer">
              <ReviewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/published" 
          element={
            <ProtectedRoute allowAny>
              <PublishedPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/data" 
          element={
            <ProtectedRoute requiredRole="inputUser">
              <DataManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;