import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService, { SalesPlan } from '../services/apiService';
import DateTimeWeatherWidget from './DateTimeWeatherWidget.tsx';
import AppHeader from './AppHeader.tsx';
import './PublishedPage.css';

interface PublishedRowData {
  planId: string;
  country: string;
  year: string;
  planningPeriod: string;
  hfb: string;
  salesGoal: number;
  actualSales: number;
  variance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductDetail {
  name: string;
  salesGoal: number;
  actualSales: number;
  variance: number;
}

const PublishedPage: React.FC = () => {
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
  
  const [publishedPlans, setPublishedPlans] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [hfbFilter, setHfbFilter] = useState<string>('All');
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load published plans
  useEffect(() => {
    loadPublishedPlans();
  }, []);

  const loadPublishedPlans = async () => {
    try {
      setLoading(true);
      const plans = await apiService.getAllSalesPlans();
      
      // Get all plans (we'll filter by row-level published status later)
      setPublishedPlans(plans);
    } catch (err) {
      console.error('Failed to load published plans:', err);
      setError('Failed to load published plans');
    } finally {
      setLoading(false);
    }
  };

  // Convert plans to rows with published status check
  const publishedRows = useMemo((): PublishedRowData[] => {
    const rows: PublishedRowData[] = [];
    const savedStatuses = localStorage.getItem('reviewRowStatuses');
    const rowStatuses = savedStatuses ? JSON.parse(savedStatuses) : {};

    publishedPlans.forEach(plan => {
      plan.rows.forEach((row, index) => {
        const rowKey = `${plan.id}-${index}`;
        const rowStatus = rowStatuses[rowKey] || 'pending';
        
        // Only include rows that are marked as published
        if (rowStatus === 'published') {
          rows.push({
            planId: plan.id,
            country: plan.country,
            year: plan.year,
            planningPeriod: row.planningPeriod || '',
            hfb: row.hfb || '',
            salesGoal: row.salesGoal,
            actualSales: row.actualSales,
            variance: row.variance,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
          });
        }
      });
    });

    // Sort by year (desc), country (asc), planning period (asc), hfb (asc)
    return rows.sort((a, b) => {
      if (a.year !== b.year) return b.year.localeCompare(a.year);
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      if (a.planningPeriod !== b.planningPeriod) return a.planningPeriod.localeCompare(b.planningPeriod);
      return a.hfb.localeCompare(b.hfb);
    });
  }, [publishedPlans]);

  // Filter options - consistent with main page
  const getFilterOptions = () => {
    // Fixed year range from 2020 to 2025 (same as main page)
    const years = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());
    
    // Fixed country options (same as main page) 
    const countries = ['Sweden', 'Denmark', 'Norway', 'Finland', 'USA'].sort();
    
    // Fixed HFB options (new standardized values)
    const hfbOptions = ['HFB 01 Living room seating', 'HFB 02 Store and organise furniture', 'HFB 03 Workspaces', 'HFB 04 Bedroom furniture', 'HFB 05 Beds & Mattresses', 'HFB 06 Bathroom', 'HFB 07 Kitchen'];
    
    return { years, countries, hfbOptions };
  };

  const filterOptions = getFilterOptions();

  // Filtered rows
  const filteredRows = useMemo(() => {
    return publishedRows.filter(row => {
      if (yearFilter !== 'All' && row.year !== yearFilter) return false;
      if (countryFilter !== 'All' && row.country !== countryFilter) return false;
      if (hfbFilter !== 'All' && row.hfb !== hfbFilter) return false;
      return true;
    });
  }, [publishedRows, yearFilter, countryFilter, hfbFilter]);

  // Generate product details for a given row
  const generateProductDetails = (row: PublishedRowData): ProductDetail[] => {
    const products = ['Skogsta', 'Billi', 'Hagernas', 'Fengommare'];
    const productDetails: ProductDetail[] = [];
    
    // Generate realistic product breakdowns that sum to the row totals
    const remainingSalesGoal = row.salesGoal;
    const remainingActualSales = row.actualSales;
    
    products.forEach((productName, index) => {
      if (index === products.length - 1) {
        // Last product gets the remainder
        const salesGoal = remainingSalesGoal - productDetails.reduce((sum, p) => sum + p.salesGoal, 0);
        const actualSales = remainingActualSales - productDetails.reduce((sum, p) => sum + p.actualSales, 0);
        productDetails.push({
          name: productName,
          salesGoal: Math.max(0, salesGoal),
          actualSales: Math.max(0, actualSales),
          variance: actualSales - salesGoal
        });
      } else {
        // Generate a percentage for this product (15-40% of remaining)
        const percentage = 0.15 + (Math.random() * 0.25); // 15-40%
        const salesGoal = Math.round(remainingSalesGoal * percentage);
        const actualSalesVariation = 0.8 + (Math.random() * 0.4); // 80-120% of goal
        const actualSales = Math.round(salesGoal * actualSalesVariation);
        
        productDetails.push({
          name: productName,
          salesGoal,
          actualSales,
          variance: actualSales - salesGoal
        });
      }
    });
    
    return productDetails;
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowKey: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowKey)) {
      newExpandedRows.delete(rowKey);
    } else {
      newExpandedRows.add(rowKey);
    }
    setExpandedRows(newExpandedRows);
  };

  if (loading) {
    return (
      <div className="published-page">
        <div className="loading">Loading published data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="published-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="published-page">
      <DateTimeWeatherWidget />
      <AppHeader />

      <div className="published-filters">
        <div className="filter-group">
          <label htmlFor="year-filter">Year:</label>
          <select
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="All">All Years</option>
            {filterOptions.years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="country-filter">Country:</label>
          <select
            id="country-filter"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            <option value="All">All Countries</option>
            {filterOptions.countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="hfb-filter">HFB:</label>
          <select
            id="hfb-filter"
            value={hfbFilter}
            onChange={(e) => setHfbFilter(e.target.value)}
          >
            <option value="All">All HFBs</option>
            {filterOptions.hfbOptions.map(hfb => (
              <option key={hfb} value={hfb}>{hfb}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="published-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Published Rows:</span>
            <span className="stat-value">{filteredRows.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Sales Goal:</span>
            <span className="stat-value">
              {filteredRows.reduce((sum, row) => sum + row.salesGoal, 0).toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Year-to-Date Sales:</span>
            <span className="stat-value">
              {filteredRows.reduce((sum, row) => sum + row.actualSales, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="no-data">
          <p>No published data found for the selected filters.</p>
          <p>Data will appear here once sales plans have been reviewed and published.</p>
        </div>
      ) : (
        <div className="published-table-container">
          <table className="published-table">
            <thead>
              <tr>
                <th></th>
                <th>Year</th>
                <th>Country</th>
                <th>Planning Period</th>
                <th>HFB</th>
                <th>Sales Goal</th>
                <th>Year-to-Date Sales</th>
                <th>Variance</th>
                <th>Published Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const rowKey = `${row.planId}-${row.planningPeriod}-${index}`;
                const isExpanded = expandedRows.has(rowKey);
                const productDetails = generateProductDetails(row);
                
                return (
                  <React.Fragment key={rowKey}>
                    <tr className="main-row">
                      <td>
                        <button 
                          className="expand-button"
                          onClick={() => toggleRowExpansion(rowKey)}
                          title={isExpanded ? "Collapse product details" : "Expand product details"}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>{row.year}</td>
                      <td>{row.country}</td>
                      <td>{row.planningPeriod}</td>
                      <td>{row.hfb}</td>
                      <td>{row.salesGoal.toLocaleString()}</td>
                      <td>{row.actualSales.toLocaleString()}</td>
                      <td className={row.variance >= 0 ? 'positive' : 'negative'}>
                        {row.variance >= 0 ? '+' : ''}{row.variance.toLocaleString()}
                      </td>
                      <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan={9}>
                          <div className="product-details">
                            <table className="product-table">
                              <thead>
                                <tr>
                                  <th></th>
                                  <th></th>
                                  <th></th>
                                  <th></th>
                                  <th></th>
                                  <th>Product</th>
                                  <th>Sales Goal</th>
                                  <th>Year-to-Date Sales</th>
                                  <th>Variance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productDetails.map((product) => (
                                  <tr key={product.name}>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="product-name">{product.name}</td>
                                    <td>{product.salesGoal.toLocaleString()}</td>
                                    <td>{product.actualSales.toLocaleString()}</td>
                                    <td className={product.variance >= 0 ? 'positive' : 'negative'}>
                                      {product.variance >= 0 ? '+' : ''}{product.variance.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PublishedPage;