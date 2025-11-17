import React from 'react';
import { WorkflowStatus, SalesData } from '../types';

interface WorkflowControlsProps {
  currentStatus: WorkflowStatus;
  onStatusChange: (status: WorkflowStatus) => void;
  isDataValid: boolean;
  salesData: SalesData;
  onDataReset?: () => void;
  currentEntryId?: string | null;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  currentStatus,
  onStatusChange,
  isDataValid,
  salesData,
  onDataReset,
  currentEntryId
}) => {
  const handleSendForReview = () => {
    if (isDataValid) {
      alert('Data has been sent for review successfully!');
      
      // Send email notification
      const reviewUrl = currentEntryId 
        ? `${window.location.origin}/review?entryId=${currentEntryId}`
        : `${window.location.origin}/review`;
      const emailSubject = 'Sales Planning Data Ready for Review';
      const emailBody = `Hello,

A new set of sales planning data is ready for your review.

Country: ${salesData.country}
Number of quarters: ${salesData.rows.length}

Please click the following link to review the data:
${reviewUrl}

Best regards,
IKEA Sales Planning System`;

      // Create mailto link
      const mailtoLink = `mailto:timothy.collins@ingka.ikea.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.open(mailtoLink);
      
      // Change status to review but stay on the same page
      onStatusChange('review');
    }
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
      case 'denied':
        return 'Denied';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="workflow-controls">
      {currentStatus !== 'draft' && (
        <div className="status-indicator">
          <span className={`status-badge ${currentStatus}`}>
            {getStatusText()}
          </span>
        </div>
      )}

      <div className="workflow-buttons">
        {currentStatus === 'draft' && (
          <button
            className="btn send-for-review"
            onClick={handleSendForReview}
            disabled={!isDataValid}
            title={!isDataValid ? "Please fill in all required fields" : ""}
          >
            Send For Review
          </button>
        )}

        {currentStatus === 'review' && (
          <div className="under-review-message">
            <span className="review-status">Under Review</span>
            <p>Data has been sent for review. Please wait for approval.</p>
          </div>
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

        {currentStatus === 'denied' && (
          <div className="denied-message">
            <span className="denied-status">Plan Denied</span>
            <p>This plan has been denied and is available for editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowControls;