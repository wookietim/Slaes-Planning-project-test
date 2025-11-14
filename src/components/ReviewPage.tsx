import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SalesData } from '../types';

interface LocationState {
  salesData: SalesData;
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reviewComment, setReviewComment] = useState('');
  
  // Get the sales data from navigation state, or use default if not available
  const salesData = (location.state as LocationState)?.salesData || {
    country: 'No data',
    rows: []
  };

  const handleApprove = () => {
    alert(`Data has been approved! ${reviewComment ? `Comment: ${reviewComment}` : ''}`);
    navigate('/', { 
      state: { 
        status: 'approved', 
        salesData,
        reviewComment 
      } 
    });
  };

  const handleDisapprove = () => {
    const comment = reviewComment.trim();
    if (!comment) {
      alert('Please provide a comment explaining why the data is disapproved.');
      return;
    }
    
    alert(`Data has been disapproved. Reason: ${comment}`);
    navigate('/', { 
      state: { 
        status: 'draft', 
        salesData,
        reviewComment: comment
      } 
    });
  };

  const handleBackToForm = () => {
    navigate('/', { state: { salesData } });
  };

  if (!salesData || salesData.rows.length === 0) {
    return (
      <div className="review-page">
        <div className="review-container">
          <h1>Review Page</h1>
          <div className="no-data">
            <p>No data available for review.</p>
            <button className="btn back-btn" onClick={() => navigate('/')}>
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