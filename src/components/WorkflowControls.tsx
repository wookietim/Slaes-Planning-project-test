import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkflowStatus, SalesData } from '../types';

interface WorkflowControlsProps {
  currentStatus: WorkflowStatus;
  onStatusChange: (status: WorkflowStatus) => void;
  isDataValid: boolean;
  salesData: SalesData;
  onDataReset?: () => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  currentStatus,
  onStatusChange,
  isDataValid,
  salesData,
  onDataReset
}) => {
  const navigate = useNavigate();

  const handleSendForReview = () => {
    if (isDataValid) {
      alert('Data has been sent for review successfully!');
      // Navigate to review page with the sales data
      navigate('/review', { state: { salesData } });
    }
  };

  const handleApprove = () => {
    onStatusChange('approved');
  };

  const handlePublish = () => {
    alert('Data Published');
    onStatusChange('published');
    // Reset the data after publishing
    if (onDataReset) {
      setTimeout(() => {
        onDataReset();
        onStatusChange('draft');
      }, 1000); // Small delay to show the published state briefly
    }
  };

  const handleVersioning = () => {
    // Reset to draft for new version
    onStatusChange('draft');
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'draft':
        return 'Draft';
      case 'review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'published':
        return 'Published';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="workflow-controls">
      <div className="status-indicator">
        <span className={`status-badge ${currentStatus}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="workflow-buttons">
        {currentStatus === 'draft' && (
          <button
            className="btn send-for-review"
            onClick={handleSendForReview}
            disabled={!isDataValid}
            title={!isDataValid ? "Please fill in all required fields" : ""}
          >
            Send for review, assign reviewer
          </button>
        )}

        {currentStatus === 'review' && (
          <button
            className="btn approve"
            onClick={handleApprove}
          >
            Approved
          </button>
        )}

        {currentStatus === 'approved' && (
          <button
            className="btn publish"
            onClick={handlePublish}
          >
            Publish
          </button>
        )}

        {currentStatus === 'published' && (
          <button
            className="btn versioning"
            onClick={handleVersioning}
          >
            versioning
          </button>
        )}
      </div>

      <div className="workflow-diagram">
        <div className={`workflow-step ${currentStatus === 'review' ? 'active' : currentStatus === 'approved' || currentStatus === 'published' ? 'completed' : ''}`}>
          <div className="step-label">Send for review, assign reviewer</div>
        </div>
        
        <div className="workflow-arrow">→</div>
        
        <div className={`workflow-step ${currentStatus === 'approved' ? 'active' : currentStatus === 'published' ? 'completed' : ''}`}>
          <div className="step-label">Approved</div>
        </div>
        
        <div className="workflow-arrow">→</div>
        
        <div className={`workflow-step ${currentStatus === 'published' ? 'active' : ''}`}>
          <div className="step-label">Publish</div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowControls;