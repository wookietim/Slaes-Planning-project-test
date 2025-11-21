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
  // Create sales_plans table (keep rows column for backward compatibility)
  const createSalesPlansTable = `
    CREATE TABLE IF NOT EXISTS sales_plans (
      id TEXT PRIMARY KEY,
      country TEXT NOT NULL,
      year TEXT NOT NULL DEFAULT '2025',
      status TEXT NOT NULL,
      user_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create sales_plan_rows table
  const createSalesPlanRowsTable = `
    CREATE TABLE IF NOT EXISTS sales_plan_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      tertial TEXT,
      quarter TEXT,
      hfb TEXT,
      sales_goal REAL NOT NULL,
      actual_sales REAL NOT NULL,
      variance REAL NOT NULL,
      qty REAL,
      row_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES sales_plans(id) ON DELETE CASCADE
    )
  `;

  // Create indexes for better performance
  const createPlanIdIndex = `
    CREATE INDEX IF NOT EXISTS idx_plan_id ON sales_plan_rows(plan_id)
  `;

  const createPlanStatusIndex = `
    CREATE INDEX IF NOT EXISTS idx_plan_status ON sales_plans(status)
  `;

  const createPlanYearCountryIndex = `
    CREATE INDEX IF NOT EXISTS idx_plan_year_country ON sales_plans(year, country)
  `;
  
  db.serialize(() => {
    console.log('🔧 Initializing database schema...');
    
    db.run(createSalesPlansTable, (err) => {
      if (err) {
        console.error('❌ Error creating sales_plans table:', err.message);
      } else {
        console.log('✅ Sales plans table ready.');
      }
    });

    db.run(createSalesPlanRowsTable, (err) => {
      if (err) {
        console.error('❌ Error creating sales_plan_rows table:', err.message);
      } else {
        console.log('✅ Sales plan rows table ready.');
      }
    });

    db.run(createPlanIdIndex, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('❌ Error creating plan_id index:', err.message);
      } else {
        console.log('✅ Index on plan_id created/verified.');
      }
    });

    db.run(createPlanStatusIndex, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('❌ Error creating status index:', err.message);
      } else {
        console.log('✅ Index on status created/verified.');
      }
    });

    db.run(createPlanYearCountryIndex, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('❌ Error creating year/country index:', err.message);
      } else {
        console.log('✅ Index on year/country created/verified.');
      }
    });

    // Migration: Check if old rows column exists and migrate data
    console.log('🔍 Checking for data migration needs...');
    db.all("PRAGMA table_info(sales_plans)", [], (err, columns) => {
      if (err) {
        console.error('❌ Error checking table schema:', err.message);
        return;
      }

      console.log('📋 Table columns:', columns.map(c => c.name).join(', '));
      const hasRowsColumn = columns.some(col => col.name === 'rows');
      
      if (hasRowsColumn) {
        console.log('📦 Found legacy rows column. Checking for data to migrate...');
        
        // Check if there's any data to migrate
        db.get('SELECT COUNT(*) as count FROM sales_plans WHERE rows IS NOT NULL AND rows != ""', [], (err, result) => {
          if (err) {
            console.error('❌ Error counting plans with data:', err.message);
            return;
          }
          
          console.log(`📊 Found ${result.count} plans with legacy row data.`);
          
          if (result.count === 0) {
            console.log('✅ No migration needed - all data already migrated or no legacy data exists.');
            return;
          }
          
          // Migrate data from old schema to new schema
          db.all('SELECT * FROM sales_plans WHERE rows IS NOT NULL AND rows != ""', [], (err, plans) => {
            if (err) {
              console.error('❌ Error fetching plans for migration:', err.message);
              return;
            }

            console.log(`🚀 Starting migration of ${plans.length} plans...`);
            let migratedCount = 0;
            let migratedRows = 0;
            let errorCount = 0;

            plans.forEach((plan, planIndex) => {
              try {
                const rows = JSON.parse(plan.rows);
                console.log(`  📝 Migrating plan ${planIndex + 1}/${plans.length} (ID: ${plan.id}) - ${rows.length} rows`);
                
                rows.forEach((row, index) => {
                  const insertRowSQL = `
                    INSERT INTO sales_plan_rows 
                    (plan_id, tertial, quarter, hfb, sales_goal, actual_sales, variance, qty, row_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;
                  
                  db.run(insertRowSQL, [
                    plan.id,
                    row.tertial || null,
                    row.quarter || null,
                    row.hfb || null,
                    row.salesGoal || 0,
                    row.actualSales || 0,
                    row.variance || 0,
                    row.qty || null,
                    index
                  ], (err) => {
                    if (err) {
                      console.error(`    ❌ Error migrating row ${index} for plan ${plan.id}:`, err.message);
                      errorCount++;
                    } else {
                      migratedRows++;
                      if (index === 0) {
                        console.log(`    ✅ Successfully inserted row ${index + 1}/${rows.length}`);
                      }
                    }
                  });
                });
                migratedCount++;
              } catch (error) {
                console.error(`❌ Error parsing rows for plan ${plan.id}:`, error.message);
                errorCount++;
              }
            });

            setTimeout(() => {
              console.log('\n' + '='.repeat(60));
              console.log('🎉 MIGRATION SUMMARY:');
              console.log(`   ✅ Plans migrated: ${migratedCount}`);
              console.log(`   ✅ Total rows migrated: ${migratedRows}`);
              if (errorCount > 0) {
                console.log(`   ⚠️  Errors encountered: ${errorCount}`);
              }
              console.log('   📌 Old rows column kept for backup.');
              console.log('   💡 You can drop it with: ALTER TABLE sales_plans DROP COLUMN rows');
              console.log('='.repeat(60) + '\n');
            }, 1500);
          });
        });
      } else {
        console.log('ℹ️  No rows column found - fresh database or already migrated.');
      }
    });
  });
}

// API Routes

// Get all sales plans
app.get('/api/sales-plans', (req, res) => {
  console.log('📥 GET /api/sales-plans - Fetching all plans');
  const sql = 'SELECT * FROM sales_plans ORDER BY updated_at DESC';
  
  db.all(sql, [], (err, plans) => {
    if (err) {
      console.error('❌ Error fetching sales plans:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`   Found ${plans.length} plans, fetching rows...`);
    
    // Fetch rows for each plan
    const planPromises = plans.map(plan => {
      return new Promise((resolve, reject) => {
        const rowsSql = 'SELECT * FROM sales_plan_rows WHERE plan_id = ? ORDER BY row_order';
        db.all(rowsSql, [plan.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: plan.id,
              country: plan.country,
              year: plan.year || '2025',
              status: plan.status,
              user: plan.user_email,
              rows: rows.map(row => ({
                tertial: row.tertial,
                quarter: row.quarter,
                hfb: row.hfb,
                salesGoal: row.sales_goal,
                actualSales: row.actual_sales,
                variance: row.variance,
                qty: row.qty
              })),
              createdAt: new Date(plan.created_at),
              updatedAt: new Date(plan.updated_at)
            });
          }
        });
      });
    });

    Promise.all(planPromises)
      .then(salesPlans => {
        console.log(`✅ Successfully returned ${salesPlans.length} plans with rows`);
        res.json(salesPlans);
      })
      .catch(err => {
        console.error('❌ Error fetching plan rows:', err.message);
        res.status(500).json({ error: err.message });
      });
  });
});

// Get sales plans by status (MUST be before /:id route)
app.get('/api/sales-plans/status/:status', (req, res) => {
  console.log(`📥 GET /api/sales-plans/status/${req.params.status}`);
  const sql = 'SELECT * FROM sales_plans WHERE status = ? ORDER BY updated_at DESC';
  
  db.all(sql, [req.params.status], (err, plans) => {
    if (err) {
      console.error('❌ Error fetching sales plans by status:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`   Found ${plans.length} plans with status '${req.params.status}', fetching rows...`);
    
    // Fetch rows for each plan
    const planPromises = plans.map(plan => {
      return new Promise((resolve, reject) => {
        const rowsSql = 'SELECT * FROM sales_plan_rows WHERE plan_id = ? ORDER BY row_order';
        db.all(rowsSql, [plan.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: plan.id,
              country: plan.country,
              year: plan.year || '2025',
              status: plan.status,
              user: plan.user_email,
              rows: rows.map(row => ({
                tertial: row.tertial,
                quarter: row.quarter,
                hfb: row.hfb,
                salesGoal: row.sales_goal,
                actualSales: row.actual_sales,
                variance: row.variance,
                qty: row.qty
              })),
              createdAt: new Date(plan.created_at),
              updatedAt: new Date(plan.updated_at)
            });
          }
        });
      });
    });

    Promise.all(planPromises)
      .then(salesPlans => res.json(salesPlans))
      .catch(err => {
        console.error('Error fetching plan rows:', err.message);
        res.status(500).json({ error: err.message });
      });
  });
});

// Get a specific sales plan by ID
app.get('/api/sales-plans/:id', (req, res) => {
  console.log(`📥 GET /api/sales-plans/${req.params.id}`);
  const sql = 'SELECT * FROM sales_plans WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, plan) => {
    if (err) {
      console.error('❌ Error fetching sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!plan) {
      console.log('⚠️  Plan not found');
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    console.log('   Plan found, fetching rows...');
    
    // Fetch rows for this plan
    const rowsSql = 'SELECT * FROM sales_plan_rows WHERE plan_id = ? ORDER BY row_order';
    db.all(rowsSql, [plan.id], (err, rows) => {
      if (err) {
        console.error('❌ Error fetching plan rows:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      console.log(`✅ Returning plan with ${rows.length} rows`);
      const salesPlan = {
        id: plan.id,
        country: plan.country,
        year: plan.year || '2025',
        status: plan.status,
        user: plan.user_email,
        rows: rows.map(row => ({
          tertial: row.tertial,
          quarter: row.quarter,
          hfb: row.hfb,
          salesGoal: row.sales_goal,
          actualSales: row.actual_sales,
          variance: row.variance,
          qty: row.qty
        })),
        createdAt: new Date(plan.created_at),
        updatedAt: new Date(plan.updated_at)
      };
      
      res.json(salesPlan);
    });
  });
});

// Create a new sales plan
app.post('/api/sales-plans', (req, res) => {
  const { country, year, status, rows, user } = req.body;
  const id = Date.now().toString();
  console.log(`📝 POST /api/sales-plans - Creating new plan (ID: ${id}, Country: ${country}, Year: ${year}, ${rows?.length || 0} rows)`);
  
  const sql = `
    INSERT INTO sales_plans (id, country, year, status, user_email)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [id, country, year || '2025', status, user], function(err) {
    if (err) {
      console.error('❌ Error creating sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('   ✅ Plan created, inserting rows...');
    
    // Insert rows
    if (rows && rows.length > 0) {
      const insertRowSQL = `
        INSERT INTO sales_plan_rows 
        (plan_id, tertial, quarter, hfb, sales_goal, actual_sales, variance, qty, row_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      let hasError = false;
      
      rows.forEach((row, index) => {
        db.run(insertRowSQL, [
          id,
          row.tertial || null,
          row.quarter || null,
          row.hfb || null,
          row.salesGoal || 0,
          row.actualSales || 0,
          row.variance || 0,
          row.qty || null,
          index
        ], (err) => {
          if (err && !hasError) {
            hasError = true;
            console.error('Error inserting row:', err.message);
            res.status(500).json({ error: err.message });
            return;
          }
          
          completed++;
          if (completed === rows.length && !hasError) {
            console.log(`✅ Successfully created plan with ${rows.length} rows`);
            res.status(201).json({ id, message: 'Sales plan created successfully' });
          }
        });
      });
    } else {
      console.log('✅ Successfully created plan (no rows)');
      res.status(201).json({ id, message: 'Sales plan created successfully' });
    }
  });
});

// Update a sales plan
app.put('/api/sales-plans/:id', (req, res) => {
  const { country, year, status, rows, user } = req.body;
  console.log(`✏️  PUT /api/sales-plans/${req.params.id} - Updating plan (${rows?.length || 0} rows)`);
  
  const sql = `
    UPDATE sales_plans 
    SET country = ?, year = ?, status = ?, user_email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(sql, [country, year || '2025', status, user, req.params.id], function(err) {
    if (err) {
      console.error('❌ Error updating sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('   ✅ Plan updated, replacing rows...');
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    // Delete existing rows for this plan
    const deleteRowsSQL = 'DELETE FROM sales_plan_rows WHERE plan_id = ?';
    db.run(deleteRowsSQL, [req.params.id], (err) => {
      if (err) {
        console.error('Error deleting old rows:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Insert new rows
      if (rows && rows.length > 0) {
        const insertRowSQL = `
          INSERT INTO sales_plan_rows 
          (plan_id, tertial, quarter, hfb, sales_goal, actual_sales, variance, qty, row_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        let completed = 0;
        let hasError = false;
        
        rows.forEach((row, index) => {
          db.run(insertRowSQL, [
            req.params.id,
            row.tertial || null,
            row.quarter || null,
            row.hfb || null,
            row.salesGoal || 0,
            row.actualSales || 0,
            row.variance || 0,
            row.qty || null,
            index
          ], (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error('Error inserting row:', err.message);
              res.status(500).json({ error: err.message });
              return;
            }
            
            completed++;
            if (completed === rows.length && !hasError) {
              console.log(`✅ Successfully updated plan with ${rows.length} rows`);
              res.json({ message: 'Sales plan updated successfully' });
            }
          });
        });
      } else {
        console.log('✅ Successfully updated plan (no rows)');
        res.json({ message: 'Sales plan updated successfully' });
      }
    });
  });
});

// Delete a sales plan
app.delete('/api/sales-plans/:id', (req, res) => {
  console.log(`🗑️  DELETE /api/sales-plans/${req.params.id}`);
  const sql = 'DELETE FROM sales_plans WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      console.error('❌ Error deleting sales plan:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      console.log('⚠️  Plan not found');
      res.status(404).json({ error: 'Sales plan not found' });
      return;
    }
    
    console.log('✅ Plan deleted successfully (rows cascade deleted)');
    res.json({ message: 'Sales plan deleted successfully' });
  });
});

// Clear all data (for testing)
app.delete('/api/sales-plans', (req, res) => {
  console.log('🗑️  DELETE /api/sales-plans - CLEARING ALL DATA');
  // First delete all rows
  db.run('DELETE FROM sales_plan_rows', [], function(err) {
    if (err) {
      console.error('❌ Error clearing rows:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    const rowsDeleted = this.changes;
    console.log(`   Deleted ${rowsDeleted} rows`);
    
    // Then delete all plans
    db.run('DELETE FROM sales_plans', [], function(err) {
      if (err) {
        console.error('❌ Error clearing data:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      
      const plansDeleted = this.changes;
      console.log(`✅ Database cleared: ${plansDeleted} plans, ${rowsDeleted} rows deleted`);
      res.json({ message: 'All sales plans deleted successfully' });
    });
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