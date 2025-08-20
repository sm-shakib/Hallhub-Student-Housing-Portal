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
  port: 12345,//port updated
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
    const sql = 'SELECT * FROM Events ORDER BY event_date DESC';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, event_date, location, organizer_id } = req.body;

    if (!title || !event_date || !location) {
      return res.status(400).json({ error: 'Please provide title, date, and location' });
    }

    const sql = `
      INSERT INTO Events (title, description, event_date, location, organizer_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [title, description, event_date, location, organizer_id]);

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

// API routes for lost items
app.get('/api/lostitems', async (req, res) => {
  try {
    const sql = 'SELECT * FROM Lost_Items ORDER BY date_lost DESC';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});

app.post('/api/lostitems', async (req, res) => {
  try {
    const { item_name, description, date_lost, location_lost, finder_contact, student_id } = req.body;

    if (!item_name || !date_lost || !location_lost) {
      return res.status(400).json({ error: 'Please provide item name, date lost, and location' });
    }

    const sql = `
      INSERT INTO Lost_Items (item_name, description, date_lost, location_lost, finder_contact, student_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [item_name, description, date_lost, location_lost, finder_contact, student_id]);

    res.json({
      success: true,
      message: 'Lost item reported successfully',
      itemId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to report lost item' });
  }
});

// API routes for found items
app.get('/api/founditems', async (req, res) => {
  try {
    const sql = 'SELECT * FROM Found_Items ORDER BY date_found DESC';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch found items' });
  }
});

app.post('/api/founditems', async (req, res) => {
  try {
    const { item_name, description, date_found, location_found, finder_contact, student_id } = req.body;

    if (!item_name || !date_found || !location_found) {
      return res.status(400).json({ error: 'Please provide item name, date found, and location' });
    }

    const sql = `
      INSERT INTO Found_Items (item_name, description, date_found, location_found, finder_contact, student_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [item_name, description, date_found, location_found, finder_contact, student_id]);

    res.json({
      success: true,
      message: 'Found item reported successfully',
      itemId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to report found item' });
  }
});

// API routes for complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM Complaints';
    let params = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY complaint_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { title, description, category, student_id } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Please provide title, description, and category' });
    }

    const sql = `
      INSERT INTO Complaints (title, description, category, student_id, status, complaint_date)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `;
    const [result] = await pool.execute(sql, [title, description, category, student_id]);

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
      SET status = 'resolved', resolution = ?, resolved_date = NOW()
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
    let sql = 'SELECT * FROM Room_Allocations';
    let params = [];
    
    if (student_id) {
      sql += ' WHERE student_id = ?';
      params.push(student_id);
    }
    
    sql += ' ORDER BY allocation_date DESC';
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
    let sql = 'SELECT * FROM Visitor_Applications';
    let params = [];
    let conditions = [];
    
    if (student_id) {
      conditions.push('student_id = ?');
      params.push(student_id);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY application_date DESC';
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

// API routes for item categories
app.get('/api/item-categories', async (req, res) => {
  try {
    const sql = `
      SELECT 
        category,
        COUNT(CASE WHEN type = 'lost' THEN 1 END) as lost_count,
        COUNT(CASE WHEN type = 'found' THEN 1 END) as found_count
      FROM (
        SELECT 'Electronics' as category, 'lost' as type FROM Lost_Items WHERE item_name LIKE '%phone%' OR item_name LIKE '%laptop%' OR item_name LIKE '%tablet%'
        UNION ALL
        SELECT 'Electronics' as category, 'found' as type FROM Found_Items WHERE item_name LIKE '%phone%' OR item_name LIKE '%laptop%' OR item_name LIKE '%tablet%'
        UNION ALL
        SELECT 'Documents' as category, 'lost' as type FROM Lost_Items WHERE item_name LIKE '%card%' OR item_name LIKE '%certificate%' OR item_name LIKE '%paper%'
        UNION ALL
        SELECT 'Documents' as category, 'found' as type FROM Found_Items WHERE item_name LIKE '%card%' OR item_name LIKE '%certificate%' OR item_name LIKE '%paper%'
        UNION ALL
        SELECT 'Personal Items' as category, 'lost' as type FROM Lost_Items WHERE item_name LIKE '%wallet%' OR item_name LIKE '%bag%' OR item_name LIKE '%key%'
        UNION ALL
        SELECT 'Personal Items' as category, 'found' as type FROM Found_Items WHERE item_name LIKE '%wallet%' OR item_name LIKE '%bag%' OR item_name LIKE '%key%'
      ) as categorized_items
      GROUP BY category
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
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
    const [events] = await pool.execute('SELECT COUNT(*) as count FROM Events');
    stats.totalEvents = events[0].count;
    
    // Total complaints
    const [complaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints');
    stats.totalComplaints = complaints[0].count;
    
    // Pending complaints
    const [pendingComplaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints WHERE status = "pending"');
    stats.pendingComplaints = pendingComplaints[0].count;
    
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
