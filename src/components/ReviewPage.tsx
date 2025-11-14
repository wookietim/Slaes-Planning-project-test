import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SalesData } from '../types';
import apiService, { SalesPlan } from '../services/apiService';

interface LocationState {
  salesData: SalesData;
  entryId?: string;
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [reviewComment, setReviewComment] = useState('');
  const [salesPlans, setSalesPlans] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
        setSelectedPlanId(entryId);
      } else {
        // Load all sales plans with 'review' status
        const reviewPlans = await apiService.getSalesPlansByStatus('review');
        setSalesPlans(reviewPlans);
        if (reviewPlans.length > 0) {
          setSelectedPlanId(reviewPlans[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load sales plans for review. Make sure the server is running.');
      console.error('Failed to load review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = salesPlans.find(plan => plan.id === selectedPlanId);
  
  // Convert API format to component format for compatibility
  const salesData: SalesData = selectedPlan ? {
    country: selectedPlan.country,
    rows: selectedPlan.rows.map((row, index) => ({
      id: `${selectedPlan.id}-${index}`,
      quarter: row.quarter,
      hfb: '', // This field isn't stored in the new structure, using empty string
      turnover: row.salesGoal.toString(),
      profit: row.actualSales.toString(),
      qty: '', // This field isn't stored in the new structure, using empty string
      gm: row.variance.toString()
    }))
  } : {
    country: 'No data',
    rows: []
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    
    try {
      await apiService.updateSalesPlan(selectedPlan.id, {
        country: selectedPlan.country,
        status: 'approved',
        rows: selectedPlan.rows
      });
      
      alert(`Data has been approved! ${reviewComment ? `Comment: ${reviewComment}` : ''}`);
      navigate('/main', { 
        state: { 
          status: 'approved', 
          salesData,
          reviewComment,
          entryId: selectedPlan.id
        } 
      });
    } catch (error) {
      console.error('Failed to approve sales plan:', error);
      alert('Failed to approve the sales plan. Please try again.');
    }
  };

  const handleDisapprove = async () => {
    const comment = reviewComment.trim();
    if (!comment) {
      alert('Please provide a comment explaining why the data is disapproved.');
      return;
    }
    
    if (!selectedPlan) return;
    
    try {
      await apiService.updateSalesPlan(selectedPlan.id, {
        country: selectedPlan.country,
        status: 'draft',
        rows: selectedPlan.rows
      });
      
      alert(`Data has been disapproved. Reason: ${comment}`);
      navigate('/main', { 
        state: { 
          status: 'draft', 
          salesData,
          reviewComment: comment,
          entryId: selectedPlan.id
        } 
      });
    } catch (error) {
      console.error('Failed to disapprove sales plan:', error);
      alert('Failed to disapprove the sales plan. Please try again.');
    }
  };

  const handleBackToForm = () => {
    navigate('/main', { 
      state: { 
        salesData,
        entryId: selectedPlanId 
      } 
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
            <button className="btn primary-btn" onClick={() => navigate('/main')}>
              Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-container">
        <header className="review-header">
          <h1>Sales Planning Review</h1>
          <button className="btn back-btn" onClick={handleBackToForm}>
            ← Back to Form
          </button>
        </header>

        <div className="review-content">
          {salesPlans.length > 1 && (
            <div className="plan-selector">
              <label htmlFor="planSelect">Select Plan to Review:</label>
              <select 
                id="planSelect"
                value={selectedPlanId || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="plan-select"
              >
                {salesPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.country} - {new Date(plan.updatedAt).toLocaleDateString()} 
                    ({plan.rows.length} quarters)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="data-summary">
            <h2>Submitted Data</h2>
            
            <div className="country-info">
              <strong>Country:</strong> {salesData.country}
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Quarter</th>
                    <th>HFB</th>
                    <th>Turnover</th>
                    <th>Profit</th>
                    <th>Quantity</th>
                    <th>Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.quarter}</td>
                      <td>{row.hfb}</td>
                      <td>{row.turnover}</td>
                      <td>{row.profit}</td>
                      <td>{row.qty}</td>
                      <td>{row.gm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="review-section">
            <h2>Review Decision</h2>
            
            <div className="comment-section">
              <label htmlFor="reviewComment">
                Review Comments (required for disapproval):
              </label>
              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter your review comments here..."
                rows={4}
                className="review-textarea"
              />
            </div>

            <div className="review-actions">
              <button 
                className="btn approve-btn"
                onClick={handleApprove}
              >
                ✓ Approve
              </button>
              
              <button 
                className="btn disapprove-btn"
                onClick={handleDisapprove}
              >
                ✗ Disapprove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;