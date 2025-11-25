import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { SalesData } from '../types';
import apiService, { SalesPlan } from '../services/apiService';
import DateTimeWeatherWidget from './DateTimeWeatherWidget.tsx';
import AppHeader from './AppHeader.tsx';

interface LocationState {
  salesData: SalesData;
  entryId?: string;
}

interface ReviewableRow {
  planId: string;
  rowIndex: number;
  country: string;
  year: string;
  planningPeriod: string;
  hfb: string;
  salesGoal: number;
  actualSales: number;
  variance: number;
  qty: number;
  status: 'pending' | 'approved' | 'denied' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if current user has reviewer role
  const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
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
  
  // Redirect non-reviewers to main page
  if (!isReviewer) {
    window.location.href = '/main';
    return null;
  }
  const [salesPlans, setSalesPlans] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowStatuses, setRowStatuses] = useState<Record<string, 'pending' | 'approved' | 'denied' | 'published'>>({});
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  // Load row statuses from localStorage on component mount
  useEffect(() => {
    const loadRowStatuses = () => {
      const savedStatuses = localStorage.getItem('reviewRowStatuses');
      if (savedStatuses) {
        try {
          const parsed = JSON.parse(savedStatuses);
          setRowStatuses(parsed);
        } catch (error) {
          console.error('Failed to parse saved row statuses:', error);
          // Clear corrupted data
          localStorage.removeItem('reviewRowStatuses');
        }
      }
      setStatusesLoaded(true);
    };

    loadRowStatuses();
  }, []);

  // Save row statuses to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (statusesLoaded) {
      localStorage.setItem('reviewRowStatuses', JSON.stringify(rowStatuses));
    }
  }, [rowStatuses, statusesLoaded]);

  useEffect(() => {
    loadSalesPlansForReview();
  }, []);

  const loadSalesPlansForReview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get specific entry ID from URL params or location state
      const entryId = searchParams.get('entryId') || (location.state as LocationState)?.entryId;
      
      if (entryId) {
        // Load specific sales plan
        const salesPlan = await apiService.getSalesPlanById(entryId);
        setSalesPlans([salesPlan]);
      } else {
        // Load all sales plans with 'review' status
        const reviewPlans = await apiService.getSalesPlansByStatus('review');
        setSalesPlans(reviewPlans);
      }
    } catch (err) {
      setError('Failed to load sales plans for review. Make sure the server is running.');
      console.error('Failed to load review data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create flat list of all rows for individual review
  const createReviewableRows = (): ReviewableRow[] => {
    // Don't create rows until statuses are loaded to ensure proper filtering
    if (!statusesLoaded) {
      return [];
    }
    
    const allRows: ReviewableRow[] = [];
    
    salesPlans.forEach(plan => {
      plan.rows.forEach((row, index) => {
        const rowKey = `${plan.id}-${index}`;
        const status = rowStatuses[rowKey] || 'pending';
        
        // Only include rows that are pending or approved (exclude denied and published)
        if (status !== 'denied' && status !== 'published') {
          allRows.push({
            planId: plan.id,
            rowIndex: index,
            country: plan.country,
            year: plan.year || '2025',
            planningPeriod: row.planningPeriod || row.quarter || 'T1',
            hfb: row.hfb?.substring(0,6) || 'General', // Default HFB since it's not stored in current API structure
            salesGoal: row.salesGoal,
            actualSales: row.actualSales,
            variance: row.variance,
            qty: row.qty || 0,
            status: status,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
          });
        }
      });
    });

    // Sort by year, country, then planning period (to match Main page grouping)
    return allRows.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.planningPeriod.localeCompare(b.planningPeriod);
    });
  };

  // Calculate statistics for all rows (including approved ones for summary)
  const allRowsStats = useMemo(() => {
    // Don't calculate stats until statuses are loaded
    if (!statusesLoaded) {
      return { totalRows: 0, approvedCount: 0, deniedCount: 0, pendingCount: 0, publishedCount: 0 };
    }
    
    let totalRows = 0;
    let approvedCount = 0;
    let deniedCount = 0;
    let pendingCount = 0;
    let publishedCount = 0;

    salesPlans.forEach(plan => {
      plan.rows.forEach((_, index) => {
        const rowKey = `${plan.id}-${index}`;
        const status = rowStatuses[rowKey] || 'pending';
        totalRows++;
        
        if (status === 'approved') approvedCount++;
        else if (status === 'denied') deniedCount++;
        else if (status === 'published') publishedCount++;
        else pendingCount++;
      });
    });

    return { totalRows, approvedCount, deniedCount, pendingCount, publishedCount };
  }, [salesPlans, rowStatuses, statusesLoaded]);

  const reviewableRows = useMemo(() => {
    return createReviewableRows();
  }, [salesPlans, rowStatuses, statusesLoaded]);

  const handleRowApprove = (rowKey: string) => {
    setRowStatuses(prev => ({ ...prev, [rowKey]: 'approved' as const }));
  };

  const handleRowDeny = (rowKey: string) => {
    setRowStatuses(prev => ({ ...prev, [rowKey]: 'denied' }));
  };

  const handleRowPublish = (rowKey: string) => {
    setRowStatuses(prev => ({ ...prev, [rowKey]: 'published' as const }));
  };

  const handleRowReset = (rowKey: string) => {
    setRowStatuses(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-container">
          <h1>Review Page</h1>
          <div className="loading">
            <p>Loading sales plans for review...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-page">
        <div className="review-container">
          <h1>Review Page</h1>
          <div className="error">
            <p>{error}</p>
            <button className="btn primary-btn" onClick={loadSalesPlansForReview}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (salesPlans.length === 0) {
    return (
      <div className="review-page">
        <div className="review-container">
          <h1>Review Page</h1>
          <div className="no-data">
            <p>No sales plans are currently pending review.</p>
            <p>Use the "Main" tab above to create new sales plans.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <DateTimeWeatherWidget />
      <AppHeader />
      <div className="review-container">
        <div className="review-content">
          {reviewableRows.length === 0 ? (
            <div className="no-data">
              {allRowsStats.totalRows > 0 ? (
                <>
                  <p>🎉 All problematic sales plan lines have been handled!</p>
                  <div className="completion-summary">
                    <p><strong>Review Complete:</strong></p>
                    <p>• Total Lines: {allRowsStats.totalRows}</p>
                    <p>• Approved: {allRowsStats.approvedCount}</p>
                    <p>• Denied (removed): {allRowsStats.deniedCount}</p>
                    <p>• Remaining Pending: {allRowsStats.pendingCount}</p>
                  </div>
                </>
              ) : (
                <p>No sales plan lines are currently pending review.</p>
              )}
              <p>Use the "Main" tab above to create new sales plans.</p>
            </div>
          ) : (
            <div className="individual-review-section">
              <h2>Review Each Line Individually</h2>
              <p>Grouped by Country & Year, sorted by Planning Period</p>
              <div className="review-instructions">
                <p><strong>Instructions:</strong></p>
                <p>• ✓ <strong>Approve:</strong> Line will remain visible with "APPROVED" status</p>
                <p>• ✗ <strong>Deny:</strong> Line will be removed from the table immediately</p>
                <p>• 📤 <strong>Publish:</strong> Available for approved lines - publishes and removes them from the table</p>
                <p>• <strong>Reset:</strong> Returns line to "PENDING" status</p>
              </div>
              
              <div className="individual-review-table">
              {(() => {
                // Group rows by planId (which represents Country + Year)
                const groupedRows = reviewableRows.reduce((acc, row) => {
                  if (!acc[row.planId]) {
                    acc[row.planId] = {
                      country: row.country,
                      year: row.year,
                      rows: []
                    };
                  }
                  acc[row.planId].rows.push(row);
                  return acc;
                }, {} as Record<string, { country: string; year: string; rows: typeof reviewableRows }>);

                return Object.entries(groupedRows).map(([planId, group]) => (
                  <div key={planId} className="review-plan-group">
                    <div className="review-plan-header">
                      <h3>{group.country} ({group.year})</h3>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Planning Period</th>
                          <th>HFB</th>
                          <th>Turnover</th>
                          <th>Profit</th>
                          <th>Qty</th>
                          <th>GM</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => {
                          const rowKey = `${row.planId}-${row.rowIndex}`;
                          return (
                            <tr key={rowKey} className={`row-${row.status}`}>
                              <td>{row.planningPeriod}</td>
                              <td>{row.hfb}</td>
                              <td>{row.salesGoal.toLocaleString()}</td>
                              <td>{row.actualSales.toLocaleString()}</td>
                              <td>{row.qty.toLocaleString()}</td>
                              <td className={row.variance >= 0 ? 'positive-variance' : 'negative-variance'}>
                                {row.variance > 0 ? '+' : ''}{row.variance.toLocaleString()}
                              </td>
                              <td>
                                <span className={`row-status-badge ${row.status}`}>
                                  {row.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="action-buttons">
                                <button
                                  className="btn approve-row-btn"
                                  onClick={() => handleRowApprove(rowKey)}
                                  disabled={row.status === 'approved' || row.status === 'published'}
                                >
                                  ✓
                                </button>
                                <button
                                  className="btn deny-row-btn"
                                  onClick={() => handleRowDeny(rowKey)}
                                  disabled={row.status === 'denied'}
                                >
                                  ✗
                                </button>
                                {row.status === 'approved' && (
                                  <button
                                    className="btn publish-row-btn"
                                    onClick={() => handleRowPublish(rowKey)}
                                    title="Publish this approved line"
                                  >
                                    📤 Publish
                                  </button>
                                )}
                                <button
                                  className="btn reset-row-btn"
                                  onClick={() => handleRowReset(rowKey)}
                                  disabled={row.status === 'pending'}
                                >
                                  Reset
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ));
              })()}
            </div>

            <div className="review-summary">
              <div className="summary-stats">
                <span>Total Lines: {allRowsStats.totalRows}</span>
                <span>Approved: {allRowsStats.approvedCount}</span>
                <span>Published: {allRowsStats.publishedCount}</span>
                <span>Denied (removed): {allRowsStats.deniedCount}</span>
                <span>Pending: {allRowsStats.pendingCount}</span>
                <span>Remaining to Review: {reviewableRows.length}</span>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;