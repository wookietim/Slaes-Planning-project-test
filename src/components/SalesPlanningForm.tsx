import React from 'react';
import { SalesData, SalesDataRow } from '../types';

interface SalesPlanningFormProps {
  data: SalesData;
  onDataChange: (data: SalesData) => void;
  isReadOnly?: boolean;
  workflowControls?: React.ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
}

const SalesPlanningForm: React.FC<SalesPlanningFormProps> = ({
  data,
  onDataChange,
  isReadOnly = false,
  workflowControls,
  onSave,
  isSaving = false
}) => {
  const handleCountryChange = (value: string) => {
    onDataChange({
      ...data,
      country: value
    });
  };

  const handleYearChange = (value: string) => {
    onDataChange({
      ...data,
      year: value
    });
  };

  const handleRowChange = (rowId: string, field: keyof Omit<SalesDataRow, 'id'>, value: string) => {
    const updatedRows = data.rows.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    onDataChange({
      ...data,
      rows: updatedRows
    });
  };

  const addNewRow = () => {
    // Get the planning period value from the last row, or default to 'FY'
    const lastRowPlanningPeriod = data.rows.length > 0 ? data.rows[data.rows.length - 1].planningPeriod : 'FY';
    
    const newRow: SalesDataRow = {
      id: Date.now().toString(),
      planningPeriod: lastRowPlanningPeriod,
      hfb: '',
      turnover: '',
      profit: '',
      qty: '',
      gm: ''
    };
    onDataChange({
      ...data,
      rows: [...data.rows, newRow]
    });
  };

  const removeRow = (rowId: string) => {
    if (data.rows.length > 1) {
      const updatedRows = data.rows.filter(row => row.id !== rowId);
      // Update planning period labels
      const reIndexedRows = updatedRows.map((row, index) => ({
        ...row,
        planningPeriod: `T${index + 1}`
      }));
      onDataChange({
        ...data,
        rows: reIndexedRows
      });
    }
  };

  return (
    <div className="sales-planning-form">
      <div className="form-header">
        <div className="header-row">
          <div className="year-section">
            <label htmlFor="year">Year</label>
            <select
              id="year"
              value={data.year}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={isReadOnly}
              className="year-select"
            >
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div className="country-section">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              value={data.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={isReadOnly}
              className="country-select"
            >
              <option value="">Select a country</option>
              <option value="USA">USA</option>
              <option value="Sweden">Sweden</option>
              <option value="France">France</option>
              <option value="Mexico">Mexico</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="grid-headers">
          <div className="header-cell">Planning Period</div>
          <div className="header-cell">HFB</div>
          <div className="header-cell">Turnover</div>
          <div className="header-cell">Profit</div>
          <div className="header-cell">Qty</div>
          <div className="header-cell">GM</div>
          <div className="header-cell">Actions</div>
        </div>

        {data.rows.map((row) => (
          <div key={row.id} className="grid-row">
            <div className="input-cell">
              <select
                value={row.planningPeriod}
                onChange={(e) => handleRowChange(row.id, 'planningPeriod', e.target.value)}
                disabled={isReadOnly}
                className="planning-period-select"
              >
                <option value="FY">FY</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
              </select>
            </div>
            <div className="input-cell">
              <select
                value={row.hfb}
                onChange={(e) => handleRowChange(row.id, 'hfb', e.target.value)}
                disabled={isReadOnly}
                className="hfb-select"
              >
                <option value="">Select HFB</option>
                <option value="HFB 01 Living room seating">HFB 01 Living room seating</option>
                <option value="HFB 02 Store and organise furniture">HFB 02 Store and organise furniture</option>
                <option value="HFB 03 Workspaces">HFB 03 Workspaces</option>
                <option value="HFB 04 Bedroom furniture">HFB 04 Bedroom furniture</option>
                <option value="HFB 05 Beds & Mattresses">HFB 05 Beds & Mattresses</option>
                <option value="HFB 06 Bathroom">HFB 06 Bathroom</option>
                <option value="HFB 07 Kitchen">HFB 07 Kitchen</option>
              </select>
            </div>
            <div className="input-cell">
              <input
                type="text"
                value={row.turnover}
                onChange={(e) => handleRowChange(row.id, 'turnover', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter turnover"
              />
            </div>
            <div className="input-cell">
              <input
                type="text"
                value={row.profit}
                onChange={(e) => handleRowChange(row.id, 'profit', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter profit"
              />
            </div>
            <div className="input-cell">
              <input
                type="text"
                value={row.qty}
                onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter quantity"
              />
            </div>
            <div className="input-cell">
              <input
                type="text"
                value={row.gm}
                onChange={(e) => handleRowChange(row.id, 'gm', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter gross margin"
              />
            </div>
            <div className="action-cell">
              {!isReadOnly && data.rows.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => removeRow(row.id)}
                  title="Remove this row"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <div className="add-row-section">
          <button
            className="add-row-btn"
            onClick={addNewRow}
            title="Add new row"
          >
            + Add New Row
          </button>
          {onSave && (
            <button
              className="btn save-btn"
              onClick={onSave}
              disabled={isSaving}
              title="Save your current work"
            >
              {isSaving ? '💾 Saving...' : '💾 Save'}
            </button>
          )}
          {workflowControls && (
            <div className="workflow-controls-inline">
              {workflowControls}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesPlanningForm;