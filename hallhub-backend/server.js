const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS so frontend can call this API if hosted separately
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create a connection pool to freeaqldatabase.com database
const pool = mysql.createPool({
  host: 'mysql-71ed2b0-hallhub-1.g.aivencloud.com',
  port: 28592,//port updated
  user: 'avnadmin',
  password: 'AVNS_FnvYhizl3z5Xkya3Tr4',
  database: 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/test-connection', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ success: true, message: 'Database connection is working!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

// API route to handle student registration
app.post('/register', async (req, res) => {
  try {
    const {
      studentId, name, email, department, level, address, phone,
      relativeName, relativeRelation, relativeAddress, relativePhone,
      password, confirmPassword
    } = req.body;

    // Basic validation
    if (!studentId || !name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Please fill all required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if student already exists
    const checkSql = 'SELECT student_id FROM Student_Info WHERE student_id = ? OR email = ?';
    const [existing] = await pool.execute(checkSql, [studentId, email]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student ID or email already exists' });
    }

    // Hash the password before saving
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert data into DB
    const sql = `
      INSERT INTO Student_Info
      (student_id, name, email, department, level, address, phone_no, relative_name, relative_relation, relative_address, relative_phone_no, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      studentId, name, email, department, level, address, phone,
      relativeName, relativeRelation, relativeAddress, relativePhone,
      passwordHash
    ]);

    res.json({ success: true, message: 'Student registered successfully' });
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API route to handle student login
app.post('/api/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ error: 'Please provide student ID and password' });
    }

    // Find student by ID
    const sql = 'SELECT student_id, name, email, password_hash FROM Student_Info WHERE student_id = ?';
    const [rows] = await pool.execute(sql, [studentId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid student ID or password' });
    }

    const student = rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, student.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid student ID or password' });
    }

    // Return success with student info (exclude password hash)
    res.json({
      success: true,
      message: 'Login successful',
      student: {
        studentId: student.student_id,
        name: student.name,
        email: student.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API routes for events
app.get('/api/events', async (req, res) => {
  try {
    const sql = 'SELECT * FROM events ORDER BY Date DESC';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { Title,Type,Date, Description, Student_ID} = req.body;

    if (!Title || !Date || !Student_ID || !Type || !Description) {
      return res.status(400).json({ error: 'Please provide title,Type,Description, date, and ID' });
    }

    const sql = `
      INSERT INTO events (Title,Type,Date, Description, Student_ID)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [Title,Type,Date, Description,Student_ID]);

    res.json({
      success: true,
      message: 'Event created successfully',
      eventId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// API routes for lost items - Updated to match your frontend form exactly
app.get('/api/lostitems', async (req, res) => {
  try {
    const sql = `
      SELECT li.*, si.name as student_name 
      FROM Lost_Items li 
      LEFT JOIN Student_Info si ON li.student_id = si.student_id 
      ORDER BY li.date_lost DESC
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});

app.post('/api/lostitems', async (req, res) => {
  try {
    // Extract data matching your frontend form field names
    const { studentId, itemId, description, lostDate } = req.body;

    // Validation - check for required fields using your form's field names
    if (!studentId || !itemId || !lostDate) {
      return res.status(400).json({ 
        error: 'Please provide Student ID, Item ID, and Date Lost' 
      });
    }

    // Insert into database - map your form fields to database columns
    const sql = `
      INSERT INTO Lost_Items (student_id, item_name, description, date_lost)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      studentId,           // maps to student_id in database
      itemId,             // maps to item_name in database  
      description || '',  // description (optional)
      lostDate            // maps to date_lost in database
    ]);

    res.json({
      success: true,
      message: 'Lost item reported successfully',
      itemId: result.insertId
    });

  } catch (error) {
    console.error('Error submitting lost item:', error);
    res.status(500).json({ error: 'Failed to report lost item' });
  }
});

// API routes for found items - Updated to match expected frontend data
app.get('/api/founditems', async (req, res) => {
  try {
    const sql = `
      SELECT fi.*, si.name as student_name 
      FROM Found_Items fi 
      LEFT JOIN Student_Info si ON fi.student_id = si.student_id 
      ORDER BY fi.date_found DESC
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch found items' });
  }
});

app.post('/api/founditems', async (req, res) => {
  try {
    // Assuming similar field names for found items form
    const { studentId, itemId, description, foundDate } = req.body;

    if (!studentId || !itemId || !foundDate) {
      return res.status(400).json({ 
        error: 'Please provide Student ID, Item ID, and Date Found' 
      });
    }

    const sql = `
      INSERT INTO Found_Items (student_id, item_name, description, date_found)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      studentId,           // maps to student_id in database
      itemId,             // maps to item_name in database  
      description || '',  // description (optional)
      foundDate           // maps to date_found in database
    ]);

    res.json({
      success: true,
      message: 'Found item reported successfully',
      itemId: result.insertId
    });

  } catch (error) {
    console.error('Error submitting found item:', error);
    res.status(500).json({ error: 'Failed to report found item' });
  }
});

// API routes for complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT c.*, si.name as student_name 
      FROM Complaints c 
      LEFT JOIN Student_Info si ON c.student_id = si.student_id
    `;
    let params = [];
    
    if (status) {
      sql += ' WHERE c.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY c.complaint_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { title, description, student_id } = req.body;

    if (!title || !description || !student_id) {
      return res.status(400).json({ error: 'Please provide title, description, and student_id' });
    }

    const sql = `
      INSERT INTO complaint (title, description, student_id)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [title, description, student_id]);

    res.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaintId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});


app.put('/api/complaints/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const sql = `
      UPDATE Complaints 
      SET status = 1, resolution = ?, resolved_date = NOW()
      WHERE complaint_id = ?
    `;
    await pool.execute(sql, [resolution, id]);

    res.json({
      success: true,
      message: 'Complaint resolved successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
});

// API routes for allocation info
app.get('/api/allocations', async (req, res) => {
  try {
    const { student_id } = req.query;
    let sql = `
      SELECT ra.*, si.name as student_name 
      FROM Room_Allocations ra 
      LEFT JOIN Student_Info si ON ra.student_id = si.student_id
    `;
    let params = [];
    
    if (student_id) {
      sql += ' WHERE ra.student_id = ?';
      params.push(student_id);
    }
    
    sql += ' ORDER BY ra.allocation_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

app.post('/api/allocations', async (req, res) => {
  try {
    const { student_id, room_number, building, allocation_date, fee_status } = req.body;

    if (!student_id || !room_number || !building) {
      return res.status(400).json({ error: 'Please provide student ID, room number, and building' });
    }

    const sql = `
      INSERT INTO Room_Allocations (student_id, room_number, building, allocation_date, fee_status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [student_id, room_number, building, allocation_date, fee_status || 'unpaid']);

    res.json({
      success: true,
      message: 'Room allocation created successfully',
      allocationId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create allocation' });
  }
});

// API routes for visitor applications
app.get('/api/visitor-applications', async (req, res) => {
  try {
    const { student_id, status } = req.query;
    let sql = `
      SELECT va.*, si.name as student_name 
      FROM Visitor_Applications va 
      LEFT JOIN Student_Info si ON va.student_id = si.student_id
    `;
    let params = [];
    let conditions = [];
    
    if (student_id) {
      conditions.push('va.student_id = ?');
      params.push(student_id);
    }
    
    if (status) {
      conditions.push('va.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY va.application_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch visitor applications' });
  }
});

app.post('/api/visitor-applications', async (req, res) => {
  try {
    const { student_id, visitor_name, visitor_phone, visit_purpose, visit_date, visit_time } = req.body;

    if (!student_id || !visitor_name || !visit_purpose || !visit_date) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const sql = `
      INSERT INTO Visitor_Applications (student_id, visitor_name, visitor_phone, visit_purpose, visit_date, visit_time, status, application_date)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;
    const [result] = await pool.execute(sql, [student_id, visitor_name, visitor_phone, visit_purpose, visit_date, visit_time]);

    res.json({
      success: true,
      message: 'Visitor application submitted successfully',
      applicationId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit visitor application' });
  }
});

app.put('/api/visitor-applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'UPDATE Visitor_Applications SET status = "approved" WHERE application_id = ?';
    await pool.execute(sql, [id]);

    res.json({
      success: true,
      message: 'Visitor application approved successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// API routes for visitor status
app.get('/api/visitor-status', async (req, res) => {
  try {
    const { student_id } = req.query;
    
    let sql = `
      SELECT va.*, si.name as student_name 
      FROM Visitor_Applications va 
      JOIN Student_Info si ON va.student_id = si.student_id
    `;
    let params = [];
    
    if (student_id) {
      sql += ' WHERE va.student_id = ?';
      params.push(student_id);
    }
    
    sql += ' ORDER BY va.application_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch visitor status' });
  }
});

// API routes for item categories - Updated with better categorization
app.get('/api/item-categories', async (req, res) => {
  try {
    // Get all lost and found items with better categorization
    const sql = `
      SELECT 
        CASE 
          WHEN LOWER(item_name) LIKE '%phone%' OR LOWER(item_name) LIKE '%laptop%' OR LOWER(item_name) LIKE '%tablet%' OR LOWER(item_name) LIKE '%computer%' OR LOWER(item_name) LIKE '%charger%' OR LOWER(item_name) LIKE '%headphone%' OR LOWER(item_name) LIKE '%earphone%' THEN 'Electronics'
          WHEN LOWER(item_name) LIKE '%card%' OR LOWER(item_name) LIKE '%certificate%' OR LOWER(item_name) LIKE '%paper%' OR LOWER(item_name) LIKE '%document%' OR LOWER(item_name) LIKE '%id%' THEN 'Documents'
          WHEN LOWER(item_name) LIKE '%wallet%' OR LOWER(item_name) LIKE '%bag%' OR LOWER(item_name) LIKE '%key%' OR LOWER(item_name) LIKE '%watch%' OR LOWER(item_name) LIKE '%jewelry%' OR LOWER(item_name) LIKE '%glass%' THEN 'Personal Items'
          WHEN LOWER(item_name) LIKE '%book%' OR LOWER(item_name) LIKE '%pen%' OR LOWER(item_name) LIKE '%pencil%' OR LOWER(item_name) LIKE '%notebook%' OR LOWER(item_name) LIKE '%file%' THEN 'Study Materials'
          WHEN LOWER(item_name) LIKE '%cloth%' OR LOWER(item_name) LIKE '%shirt%' OR LOWER(item_name) LIKE '%jacket%' OR LOWER(item_name) LIKE '%shoe%' OR LOWER(item_name) LIKE '%cap%' THEN 'Clothing'
          ELSE 'Others'
        END as category,
        'lost' as type,
        COUNT(*) as count
      FROM Lost_Items 
      GROUP BY 
        CASE 
          WHEN LOWER(item_name) LIKE '%phone%' OR LOWER(item_name) LIKE '%laptop%' OR LOWER(item_name) LIKE '%tablet%' OR LOWER(item_name) LIKE '%computer%' OR LOWER(item_name) LIKE '%charger%' OR LOWER(item_name) LIKE '%headphone%' OR LOWER(item_name) LIKE '%earphone%' THEN 'Electronics'
          WHEN LOWER(item_name) LIKE '%card%' OR LOWER(item_name) LIKE '%certificate%' OR LOWER(item_name) LIKE '%paper%' OR LOWER(item_name) LIKE '%document%' OR LOWER(item_name) LIKE '%id%' THEN 'Documents'
          WHEN LOWER(item_name) LIKE '%wallet%' OR LOWER(item_name) LIKE '%bag%' OR LOWER(item_name) LIKE '%key%' OR LOWER(item_name) LIKE '%watch%' OR LOWER(item_name) LIKE '%jewelry%' OR LOWER(item_name) LIKE '%glass%' THEN 'Personal Items'
          WHEN LOWER(item_name) LIKE '%book%' OR LOWER(item_name) LIKE '%pen%' OR LOWER(item_name) LIKE '%pencil%' OR LOWER(item_name) LIKE '%notebook%' OR LOWER(item_name) LIKE '%file%' THEN 'Study Materials'
          WHEN LOWER(item_name) LIKE '%cloth%' OR LOWER(item_name) LIKE '%shirt%' OR LOWER(item_name) LIKE '%jacket%' OR LOWER(item_name) LIKE '%shoe%' OR LOWER(item_name) LIKE '%cap%' THEN 'Clothing'
          ELSE 'Others'
        END

      UNION ALL

      SELECT 
        CASE 
          WHEN LOWER(item_name) LIKE '%phone%' OR LOWER(item_name) LIKE '%laptop%' OR LOWER(item_name) LIKE '%tablet%' OR LOWER(item_name) LIKE '%computer%' OR LOWER(item_name) LIKE '%charger%' OR LOWER(item_name) LIKE '%headphone%' OR LOWER(item_name) LIKE '%earphone%' THEN 'Electronics'
          WHEN LOWER(item_name) LIKE '%card%' OR LOWER(item_name) LIKE '%certificate%' OR LOWER(item_name) LIKE '%paper%' OR LOWER(item_name) LIKE '%document%' OR LOWER(item_name) LIKE '%id%' THEN 'Documents'
          WHEN LOWER(item_name) LIKE '%wallet%' OR LOWER(item_name) LIKE '%bag%' OR LOWER(item_name) LIKE '%key%' OR LOWER(item_name) LIKE '%watch%' OR LOWER(item_name) LIKE '%jewelry%' OR LOWER(item_name) LIKE '%glass%' THEN 'Personal Items'
          WHEN LOWER(item_name) LIKE '%book%' OR LOWER(item_name) LIKE '%pen%' OR LOWER(item_name) LIKE '%pencil%' OR LOWER(item_name) LIKE '%notebook%' OR LOWER(item_name) LIKE '%file%' THEN 'Study Materials'
          WHEN LOWER(item_name) LIKE '%cloth%' OR LOWER(item_name) LIKE '%shirt%' OR LOWER(item_name) LIKE '%jacket%' OR LOWER(item_name) LIKE '%shoe%' OR LOWER(item_name) LIKE '%cap%' THEN 'Clothing'
          ELSE 'Others'
        END as category,
        'found' as type,
        COUNT(*) as count
      FROM Found_Items 
      GROUP BY 
        CASE 
          WHEN LOWER(item_name) LIKE '%phone%' OR LOWER(item_name) LIKE '%laptop%' OR LOWER(item_name) LIKE '%tablet%' OR LOWER(item_name) LIKE '%computer%' OR LOWER(item_name) LIKE '%charger%' OR LOWER(item_name) LIKE '%headphone%' OR LOWER(item_name) LIKE '%earphone%' THEN 'Electronics'
          WHEN LOWER(item_name) LIKE '%card%' OR LOWER(item_name) LIKE '%certificate%' OR LOWER(item_name) LIKE '%paper%' OR LOWER(item_name) LIKE '%document%' OR LOWER(item_name) LIKE '%id%' THEN 'Documents'
          WHEN LOWER(item_name) LIKE '%wallet%' OR LOWER(item_name) LIKE '%bag%' OR LOWER(item_name) LIKE '%key%' OR LOWER(item_name) LIKE '%watch%' OR LOWER(item_name) LIKE '%jewelry%' OR LOWER(item_name) LIKE '%glass%' THEN 'Personal Items'
          WHEN LOWER(item_name) LIKE '%book%' OR LOWER(item_name) LIKE '%pen%' OR LOWER(item_name) LIKE '%pencil%' OR LOWER(item_name) LIKE '%notebook%' OR LOWER(item_name) LIKE '%file%' THEN 'Study Materials'
          WHEN LOWER(item_name) LIKE '%cloth%' OR LOWER(item_name) LIKE '%shirt%' OR LOWER(item_name) LIKE '%jacket%' OR LOWER(item_name) LIKE '%shoe%' OR LOWER(item_name) LIKE '%cap%' THEN 'Clothing'
          ELSE 'Others'
        END
    `;
    
    const [rawResults] = await pool.execute(sql);
    
    // Process results to group by category
    const categoryStats = {};
    
    rawResults.forEach(row => {
      if (!categoryStats[row.category]) {
        categoryStats[row.category] = {
          category: row.category,
          lost_count: 0,
          found_count: 0
        };
      }
      
      if (row.type === 'lost') {
        categoryStats[row.category].lost_count = row.count;
      } else {
        categoryStats[row.category].found_count = row.count;
      }
    });
    
    const result = Object.values(categoryStats);
    res.json(result);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch item categories' });
  }
});

// API route for dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { student_id } = req.query;
    
    const stats = {};
    
    // Total lost items
    const [lostItems] = await pool.execute('SELECT COUNT(*) as count FROM Lost_Items');
    stats.totalLostItems = lostItems[0].count;
    
    // Total found items
    const [foundItems] = await pool.execute('SELECT COUNT(*) as count FROM Found_Items');
    stats.totalFoundItems = foundItems[0].count;
    
    // Total events
    const [events] = await pool.execute('SELECT COUNT(*) as count FROM events');
    stats.totalEvents = events[0].count;
    
    // Total complaints
    const [complaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints');
    stats.totalComplaints = complaints[0].count;
    
    // Pending complaints
    const [pendingComplaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints WHERE status = "pending"');
    stats.pendingComplaints = pendingComplaints[0].count;
    
    // Total students
    const [totalStudents] = await pool.execute('SELECT COUNT(*) as count FROM Student_Info');
    stats.totalStudents = totalStudents[0].count;
    
    // User specific stats if student_id provided
    if (student_id) {
      const [userLostItems] = await pool.execute('SELECT COUNT(*) as count FROM Lost_Items WHERE student_id = ?', [student_id]);
      stats.userLostItems = userLostItems[0].count;
      
      const [userFoundItems] = await pool.execute('SELECT COUNT(*) as count FROM Found_Items WHERE student_id = ?', [student_id]);
      stats.userFoundItems = userFoundItems[0].count;
      
      const [userComplaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints WHERE student_id = ?', [student_id]);
      stats.userComplaints = userComplaints[0].count;
    }
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashb.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'event.html'));
});

app.get('/lostitems', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lostitem.html'));
});

app.get('/founditems', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'founditem.html'));
});

app.get('/see-lost-items', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seelostitem.html'));
});

app.get('/item-categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'itemcat.html'));
});

app.get('/complaints', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'complain.html'));
});

app.get('/show-complaints', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'showcomp.html'));
});

app.get('/resolved-complaints', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resolvedcomp.html'));
});

app.get('/allocations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'allocinfo.html'));
});

app.get('/visitor-applications', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vissapp.html'));
});

app.get('/visitor-status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'visstat.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});