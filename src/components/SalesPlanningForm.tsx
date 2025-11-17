import React, { useState } from 'react';
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
  const [hfbFilter, setHfbFilter] = useState<string>('All');

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

  // Filter rows based on selected HFB filter
  const filteredRows = hfbFilter === 'All' 
    ? data.rows 
    : data.rows.filter(row => row.hfb === hfbFilter);

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
      tertial: `T${data.rows.length + 1}`,
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
      // Update tertial labels
      const reIndexedRows = updatedRows.map((row, index) => ({
        ...row,
        tertial: `T${index + 1}`
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

      <div className="hfb-filters">
        <div className="filter-section">
          <label htmlFor="hfbFilter">Filter by HFB:</label>
          <div className="filter-buttons">
            <button 
              type="button"
              className={`filter-btn ${hfbFilter === 'All' ? 'active' : ''}`}
              onClick={() => setHfbFilter('All')}
            >
              All
            </button>
            <button 
              type="button"
              className={`filter-btn ${hfbFilter === 'Sales' ? 'active' : ''}`}
              onClick={() => setHfbFilter('Sales')}
            >
              Sales
            </button>
            <button 
              type="button"
              className={`filter-btn ${hfbFilter === 'Holiday' ? 'active' : ''}`}
              onClick={() => setHfbFilter('Holiday')}
            >
              Holiday
            </button>
            <button 
              type="button"
              className={`filter-btn ${hfbFilter === 'General' ? 'active' : ''}`}
              onClick={() => setHfbFilter('General')}
            >
              General
            </button>
            <button 
              type="button"
              className={`filter-btn ${hfbFilter === 'Special' ? 'active' : ''}`}
              onClick={() => setHfbFilter('Special')}
            >
              Special
            </button>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="grid-headers">
          <div className="header-cell">Tertial</div>
          <div className="header-cell">HFB</div>
          <div className="header-cell">Turnover</div>
          <div className="header-cell">Profit</div>
          <div className="header-cell">Qty</div>
          <div className="header-cell">GM</div>
          <div className="header-cell">Actions</div>
        </div>

        {filteredRows.map((row) => (
          <div key={row.id} className="grid-row">
            <div className="input-cell">
              <select
                value={row.tertial}
                onChange={(e) => handleRowChange(row.id, 'tertial', e.target.value)}
                disabled={isReadOnly}
                className="tertial-select"
              >
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
                <option value="Sales">Sales</option>
                <option value="Holiday">Holiday</option>
                <option value="General">General</option>
                <option value="Special">Special</option>
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
            + Add New Tertial
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesPlanningForm;