const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'sales_planning.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

// Initialize database schema
function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS sales_plans (
      id TEXT PRIMARY KEY,
      country TEXT NOT NULL,
      status TEXT NOT NULL,
      rows TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Sales plans table ready.');
    }
  });
}

// API Routes

// Get all sales plans
app.get('/api/sales-plans', (req, res) => {
  const sql = 'SELECT * FROM sales_plans ORDER BY updated_at DESC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sales plans:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Parse the rows JSON data
    const salesPlans = rows.map(row => ({
      id: row.id,
      country: row.country,
      status: row.status,
      rows: JSON.parse(row.rows),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    res.json(salesPlans);
  });
});

// Get a specific sales plan by ID
app.get('/api/sales-plans/:id', (req, res) => {
  const sql = 'SELECT * FROM sales_plans WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      console.error('Error fetching sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    const salesPlan = {
      id: row.id,
      country: row.country,
      status: row.status,
      rows: JSON.parse(row.rows),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
    
    res.json(salesPlan);
  });
});

// Create a new sales plan
app.post('/api/sales-plans', (req, res) => {
  const { country, status, rows } = req.body;
  const id = Date.now().toString();
  
  const sql = `
    INSERT INTO sales_plans (id, country, status, rows)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [id, country, status, JSON.stringify(rows)], function(err) {
    if (err) {
      console.error('Error creating sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({ id, message: 'Sales plan created successfully' });
  });
});

// Update a sales plan
app.put('/api/sales-plans/:id', (req, res) => {
  const { country, status, rows } = req.body;
  
  const sql = `
    UPDATE sales_plans 
    SET country = ?, status = ?, rows = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(sql, [country, status, JSON.stringify(rows), req.params.id], function(err) {
    if (err) {
      console.error('Error updating sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    res.json({ message: 'Sales plan updated successfully' });
  });
});

// Delete a sales plan
app.delete('/api/sales-plans/:id', (req, res) => {
  const sql = 'DELETE FROM sales_plans WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      console.error('Error deleting sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    res.json({ message: 'Sales plan deleted successfully' });
  });
});

// Get sales plans by status
app.get('/api/sales-plans/status/:status', (req, res) => {
  const sql = 'SELECT * FROM sales_plans WHERE status = ? ORDER BY updated_at DESC';
  
  db.all(sql, [req.params.status], (err, rows) => {
    if (err) {
      console.error('Error fetching sales plans by status:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    const salesPlans = rows.map(row => ({
      id: row.id,
      country: row.country,
      status: row.status,
      rows: JSON.parse(row.rows),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    res.json(salesPlans);
  });
});

// Clear all data (for testing)
app.delete('/api/sales-plans', (req, res) => {
  const sql = 'DELETE FROM sales_plans';
  
  db.run(sql, [], function(err) {
    if (err) {
      console.error('Error clearing data:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ message: 'All sales plans deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sales Planning API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sales Planning API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});