import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService, { SalesPlan } from '../services/apiService';
import DateTimeWeatherWidget from './DateTimeWeatherWidget.tsx';

const DataManagementPage: React.FC = () => {
  // Check if current user has reviewer role
  const checkUserRole = (role: 'inputUser' | 'reviewer'): boolean => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
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
  
  const [entries, setEntries] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const allEntries = await apiService.getAllSalesPlans();
      setEntries(allEntries);
    } catch (err) {
      setError('Failed to load sales plans. Make sure the server is running.');
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: SalesPlan) => {
    // Convert API format back to component format
    const salesData = {
      country: entry.country,
      year: entry.year || '2025',
      rows: entry.rows.map(row => ({
        id: `${Date.now()}-${Math.random()}`,
        tertial: row.tertial,
        hfb: '', // This field isn't used in the new structure
        turnover: row.salesGoal.toString(),
        profit: row.actualSales.toString(),
        qty: '', // This field isn't used in the new structure
        gm: row.variance.toString()
      }))
    };

    navigate('/main', { 
      state: { 
        salesData,
        status: entry.status,
        entryId: entry.id 
      } 
    });
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await apiService.deleteSalesPlan(id);
        loadEntries();
      } catch (err) {
        console.error('Failed to delete entry:', err);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiService.getAllSalesPlans();
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_planning_data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL saved data? This cannot be undone.')) {
      try {
        await apiService.clearAllData();
        loadEntries();
      } catch (err) {
        console.error('Failed to clear data:', err);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'review': return 'status-review';
      case 'approved': return 'status-approved';
      case 'published': return 'status-published';
      default: return 'status-draft';
    }
  };

  return (
    <div className="data-management-page">
      <DateTimeWeatherWidget />
      <div className="data-management-container">
        <header className="app-header">
          <h1>IKEA Sales Planning</h1>
          
          {/* Tab Navigation */}
          <nav className="app-tabs">
            <div className="tab-container">
              {isInputUser && (
                <button 
                  className="tab"
                  onClick={() => navigate('/main')}
                >
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
              <button 
                className="tab"
                onClick={() => navigate('/admin')}
              >
                🔧 Admin
              </button>
            </div>
            
            <div className="app-actions">
              <button 
                className="btn export-btn" 
                onClick={handleExportData}
              >
                📥 Export Data
              </button>
              <button 
                className="btn danger-btn" 
                onClick={handleClearAllData}
              >
                🗑️ Clear All
              </button>
            </div>
          </nav>
        </header>

        <div className="data-section-header">
          <h2>💾 Saved Sales Plans</h2>
          <p>View and manage your saved sales planning data.</p>
        </div>

        <div className="entries-stats">
          <p>{entries.length} total entries saved</p>
        </div>

        {loading ? (
          <div className="loading">
            <p>Loading sales plans...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button className="btn primary-btn" onClick={loadEntries}>
              Try Again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="no-entries">
            <p>No saved sales plans yet.</p>
            <p>Use the "Main" tab above to create your first sales plan.</p>
          </div>
        ) : (
          <div className="entries-table">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Year</th>
                  <th>Tertials</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="country-cell">{entry.country || 'No country'}</td>
                    <td className="year-cell">{entry.year || '2025'}</td>
                    <td className="tertials-cell">{entry.rows.length}</td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusBadgeClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString()}
                    </td>
                    <td className="date-cell">
                      {entry.updatedAt.toLocaleDateString()} {entry.updatedAt.toLocaleTimeString()}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn small-btn edit-btn"
                        onClick={() => handleEditEntry(entry)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn small-btn delete-btn"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagementPage;