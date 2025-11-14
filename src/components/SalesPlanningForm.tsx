import React from 'react';
import { SalesData, SalesDataRow } from '../types';

interface SalesPlanningFormProps {
  data: SalesData;
  onDataChange: (data: SalesData) => void;
  isReadOnly?: boolean;
}

const SalesPlanningForm: React.FC<SalesPlanningFormProps> = ({
  data,
  onDataChange,
  isReadOnly = false
}) => {
  const handleCountryChange = (value: string) => {
    onDataChange({
      ...data,
      country: value
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
    const newRow: SalesDataRow = {
      id: Date.now().toString(),
      quarter: `Q${data.rows.length + 1}`,
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
      // Update quarter labels
      const reIndexedRows = updatedRows.map((row, index) => ({
        ...row,
        quarter: `Q${index + 1}`
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
        <div className="country-section">
          <label htmlFor="country">country</label>
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

      <div className="form-grid">
        <div className="grid-headers">
          <div className="header-cell">Quarter</div>
          <div className="header-cell">hfb</div>
          <div className="header-cell">turnover</div>
          <div className="header-cell">profit</div>
          <div className="header-cell">qty</div>
          <div className="header-cell">gm</div>
          <div className="header-cell">Actions</div>
        </div>

        {data.rows.map((row) => (
          <div key={row.id} className="grid-row">
            <div className="row-label">{row.quarter}</div>
            <div className="input-cell">
              <input
                type="text"
                value={row.hfb}
                onChange={(e) => handleRowChange(row.id, 'hfb', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter HFB"
              />
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
            + Add New Quarter
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesPlanningForm;