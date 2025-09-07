const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Enable CORS so frontend can call this API if hosted separately
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hallhub00@gmail.com',      
    pass: 'hrvv skyo ffqf pgwv'           // app password
  }
});


// Temporary in-memory OTP store (production: use Redis or DB)
const otpStore = new Map();

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
// app.post('/api/login', async (req, res) => {
//   try {
//     const { studentId, password } = req.body;

//     if (!studentId || !password) {
//       return res.status(400).json({ error: 'Please provide student ID and password' });
//     }

//     // Find student by ID
//     const sql = 'SELECT student_id, name, email, password_hash FROM Student_Info WHERE student_id = ?';
//     const [rows] = await pool.execute(sql, [studentId]);

//     if (rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid student ID or password' });
//     }

//     const student = rows[0];

//     // Verify password
//     const passwordMatch = await bcrypt.compare(password, student.password_hash);
    
//     if (!passwordMatch) {
//       return res.status(401).json({ error: 'Invalid student ID or password' });
//     }

//     // Return success with student info (exclude password hash)
//     res.json({
//       success: true,
//       message: 'Login successful',
//       student: {
//         studentId: student.student_id,
//         name: student.name,
//         email: student.email
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.post('/api/login', async (req, res) => {
  try {
    console.log('POST /api/login body:', req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success:false, message:'Username and password are required' });

    const query = `SELECT student_id, name, email, password_hash, resident_status FROM Student_Info WHERE student_id = ? LIMIT 1`;
    const [rows] = await pool.query(query, [username]);
    if (rows.length === 0) return res.status(401).json({ success:false, message:'Student not found' });

    const student = rows[0];
    if (!student.password_hash) {
      console.error('No password_hash for student:', student.student_id);
      return res.status(500).json({ success:false, message:'User has no password set. Check registration data.' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password_hash);
    if (!passwordMatch) return res.status(401).json({ success:false, message:'Incorrect password' });

    if (!student.resident_status || Number(student.resident_status) !== 1) {
      return res.status(403).json({ success:false, message:'You are not a hall resident yet' });
    }

    res.json({ success:true, message:'Login successful', student:{ studentId: student.student_id, name: student.name, email: student.email, userType: 'student'} });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success:false, message:'Server error occurred', error: err.message });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email, student_id } = req.body;

    if (!email || !student_id) {
      return res.status(400).json({ success: false, message: 'Email and Student ID are required' });
    }

    const sql = `SELECT student_id, name, email FROM Student_Info WHERE email = ? AND student_id = ?`;
    const [rows] = await pool.execute(sql, [email, student_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email and student ID combination' });
    }

    const student = rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5 min expiry
    const otpKey = `${email}_${student_id}`;
    otpStore.set(otpKey, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      student_id,
      email
    });

    // Send email
    const mailOptions = {
      from: 'hallhub00@gmail.com',
      to: email,
      subject: 'HallHub - Password Reset Code',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${student.name},</p>
        <p>Your password reset code is:</p>
        <h1 style="color:#3b82f6;letter-spacing:5px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


app.post('/api/verify-otp', async (req, res) => {
  const { email, student_id, otp } = req.body;

  if (!email || !student_id || !otp) {
    return res.status(400).json({ success: false, message: 'Email, Student ID, and OTP are required' });
  }

  const otpKey = `${email}_${student_id}`;
  const stored = otpStore.get(otpKey);

  if (!stored) {
    return res.status(400).json({ success: false, message: 'OTP not found or expired' });
  }

  if (Date.now() > stored.expires) {
    otpStore.delete(otpKey);
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  // OTP verified → issue reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  otpStore.set(otpKey, {
    token: resetToken,
    expires: Date.now() + 15 * 60 * 1000,
    student_id,
    email
  });

  res.json({ success: true, message: 'OTP verified successfully', token: resetToken });
});


app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Find token in store
    let tokenData = null;
    let tokenKey = null;

    for (const [key, data] of otpStore.entries()) {
      if (data.token === token) {
        tokenData = data;
        tokenKey = key;
        break;
      }
    }

    if (!tokenData) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (Date.now() > tokenData.expires) {
      otpStore.delete(tokenKey);
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update DB
    const sql = `UPDATE Student_Info SET password_hash = ? WHERE student_id = ? AND email = ?`;
    const [result] = await pool.execute(sql, [passwordHash, tokenData.student_id, tokenData.email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    otpStore.delete(tokenKey);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API route for non-resident students
app.get('/api/nonresident-students', async (req, res) => {
  try {
    const query = `
      SELECT 
        serial_no,
        student_id,
        name,
        email,
        department,
        level,
        address,
        phone_no AS phone,
        relative_name,
        relative_relation,
        relative_address,
        relative_phone_no AS relative_phone
      FROM Student_Info
      WHERE resident_status = 0
      ORDER BY Created_AT ASC
    `;

    const [results] = await pool.query(query);

    res.json({
      success: true,
      students: results,
      count: results.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Update student info
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serial_no, name, email, department, level, address, phone,
      relativeName, relativeRelation, relativeAddress, relativePhone
    } = req.body;

    const sql = `
      UPDATE Student_Info 
      SET serial_no =?, name=?, email=?, department=?, level=?, address=?, phone_no=?, 
          relative_name=?, relative_relation=?, relative_address=?, relative_phone_no=?
      WHERE student_id=?
    `;
    const [result] = await pool.execute(sql, [
      serial_no, name, email, department, level, address, phone,
      relativeName, relativeRelation, relativeAddress, relativePhone, id
    ]);

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

app.post('/api/add-to-resident', async (req, res) => {
  try {
    const { student_id } = req.body;
    console.log('Adding student to resident:', req.body);

    if (!student_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }

    // Check if student exists
    const checkStudentSql = 'SELECT student_id, name, email FROM Student_Info WHERE student_id = ?';
    const [studentExists] = await pool.execute(checkStudentSql, [student_id]);
    
    if (studentExists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const student = studentExists[0];

    // Check if already resident
    const checkResidentSql = 'SELECT student_id FROM Resident WHERE student_id = ?';
    const [alreadyResident] = await pool.execute(checkResidentSql, [student_id]);
    
    if (alreadyResident.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student is already a resident' 
      });
    }

    // Insert into Resident table
    const insertSql = 'INSERT INTO Resident (student_id) VALUES (?)';
    const [result] = await pool.execute(insertSql, [student_id]);

    if (result.affectedRows > 0) {
      // Update resident_status in Student_Info
      const updateStatusSql = 'UPDATE Student_Info SET resident_status = 1 WHERE student_id = ?';
      await pool.execute(updateStatusSql, [student_id]);

       // ---- Send Email ----
      const mailOptions = {
        from: 'hallhub00@gmail.com',
        to: student.email,
        subject: 'Resident Status Update',
        text: `Hello ${student.name},\n\nYou have been successfully added to the resident list.\n\nRegards,\nHallHub`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error sending email:', err);
        } else {
          console.log('Email sent:', info.response);
        }
      });


      res.json({ 
        success: true, 
        message: 'Student successfully added to resident list',
        resident_id: result.insertId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add student to resident list' 
      });
    }

  } catch (error) {
    console.error('Error adding student to resident:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error occurred', 
      error: error.message
    });
  }
});

// Get resident students by joining Resident with Student_Info
app.get('/api/resident-students', async (req, res) => {
  try {
    const query = `
      SELECT 
          r.resident_id,
          s.student_id,
          s.name AS full_name,
          s.email,
          s.department,
          s.level,
          s.address,
          s.phone_no AS phone,
          s.relative_name,
          s.relative_relation,
          s.relative_address,
          s.relative_phone_no AS relative_phone
      FROM Student_Info s
      INNER JOIN Resident r ON s.student_id = r.student_id
      ORDER BY r.Date ASC
    `;

    const [results] = await pool.query(query);

    res.json({
      success: true,
      students: results,
      count: results.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Remove student from resident status (set resident_status = 0 AND delete from Resident table)
app.post('/api/remove-from-resident', async (req, res) => {
  try {
    const { student_id } = req.body;

    //Update Student_Info (set resident_status = 0)
    const updateQuery = `
      UPDATE Student_Info 
      SET resident_status = 0 
      WHERE student_id = ?
    `;

    const [updateResults] = await pool.execute(updateQuery, [student_id]);

    if (updateResults.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    //Delete from Resident table
    const deleteQuery = `
      DELETE FROM Resident 
      WHERE student_id = ?
    `;

    await pool.execute(deleteQuery, [student_id]);

    // Final Response
    res.json({
      success: true,
      message: 'Student removed from resident list successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});


// Get all complaints ordered by time
// app.get('/api/complaints', async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//           complaint_id,
//           student_id,
//           title,
//           description,
//           time,
//           status
//       FROM complaint 
//       ORDER BY time ASC
//     `;
    
//     const [results] = await pool.query(query);

//     res.json({
//       success: true,
//       complaints: results,
//       count: results.length
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Database error occurred'
//     });
//   }
// });

app.get('/api/complaints', async (req, res) => {
    try {
        const { student_id } = req.query; // only search by student_id
        let query = 'SELECT * FROM ComplaintsView';
        const params = [];

        if (student_id) {
            query += ' WHERE student_id = ?';
            params.push(student_id);
        }

        query += ' ORDER BY time DESC';

        const [results] = await pool.query(query, params);
        res.json({ success: true, complaints: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Update complaint status
app.post('/api/update-complaint-status', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { complaint_id, status } = req.body;

    if (complaint_id === undefined || status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and status are required'
      });
    }

    await connection.beginTransaction();

    // Get current status
    const [rows] = await connection.execute(
      'SELECT status FROM complaint WHERE complaint_id = ?',
      [complaint_id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const currentStatus = rows[0].status;

    // Update complaint status
    const [result] = await connection.execute(
      'UPDATE complaint SET status = ? WHERE complaint_id = ?',
      [status, complaint_id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Handle complaint_resolution table
    if (currentStatus === 0 && status === 1) {
      // Insert when going 0 -> 1
      await connection.execute(
        `INSERT INTO complaint_resolution (Complaint_ID, Receive_Time) 
         VALUES (?, NOW())`,
        [complaint_id]
      );
    } else if (currentStatus === 1 && status === 0) {
      // Delete when going 1 -> 0
      await connection.execute(
        `DELETE FROM complaint_resolution WHERE Complaint_ID = ?`,
        [complaint_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Complaint status updated successfully'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  } finally {
    if (connection) connection.release();
  }
});


app.post('/api/complaints', async (req, res) => {
  try {
    const { title, description, student_id } = req.body;

    //console.log("📩 Incoming complaint request:", { title, description, student_id });

    if (!title || !description || !student_id) {
      //console.warn("⚠️ Missing fields:", { title, description, student_id });
      return res.status(400).json({ error: 'Please provide title, description, and student_id' });
    }

    const sql = `
      INSERT INTO complaint (title, description, student_id)
      VALUES (?, ?, ?)
    `;

    //console.log("📝 Executing SQL:", sql);
    //console.log("🔢 With values:", [title, description, student_id]);

    const [result] = await pool.execute(sql, [title, description, student_id]);

    //console.log("✅ Insert result:", result);

    res.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaintId: result.insertId
    });

  } catch (error) {
    console.error("❌ Error inserting complaint:", error);
    res.status(500).json({ 
      error: 'Failed to submit complaint',
      details: error.message,   // <-- return actual error message (for debugging only!)
      code: error.code          // <-- useful MySQL error code
    });
  }
});

// Get complaints for a specific student
app.get('/api/complaints/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const query = `
      SELECT complaint_id, student_id, title, description, time, status
      FROM complaint 
      WHERE student_id = ?
      ORDER BY time DESC
    `;
    const [results] = await pool.execute(query, [studentId]);

    res.json({
      success: true,
      complaints: results,
      count: results.length
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, message: "Database error occurred" });
  }
});

// ===============================
// Items API
// ===============================

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        item_id,
        item_type
      FROM item
      ORDER BY item_id ASC
    `);

    res.json({
      success: true,
      items: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Add new item
app.post('/api/items/add', async (req, res) => {
  const { item_type } = req.body;

  if (!item_type) {
    return res.status(400).json({
      success: false,
      message: 'Item type is required'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO item (item_type) VALUES (?)`,
      [item_type]
    );

    res.json({
      success: true,
      message: 'Item added successfully',
      item_id: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Update item
app.put('/api/items/update', async (req, res) => {
  const { item_id, item_type } = req.body;

  if (!item_id || !item_type) {
    return res.status(400).json({
      success: false,
      message: 'Item ID and type are required'
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE item SET item_type = ? WHERE item_id = ?`,
      [item_type, item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Delete item
app.delete('/api/items/delete', async (req, res) => {
  const { item_id } = req.body;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required'
    });
  }

  try {
    const [result] = await pool.query(
      `DELETE FROM item WHERE item_id = ?`,
      [item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// ===============================
// Lost & Found Items API
// ===============================

// Get Lost Items
app.get('/api/lost-items', async (req, res) => {
  try {
    const [rows] = await pool.query(`CALL GetLostItems()`);

    // NOTE: MySQL returns [ [results], [metadata] ] for CALL
    const items = rows[0] || [];

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Get Found Items
app.get('/api/found-items', async (req, res) => {
  try {
    const [rows] = await pool.query(`CALL GetFoundItems()`);

    const items = rows[0] || [];

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});


// Mark lost item as found
app.post('/api/mark-as-found', async (req, res) => {
  const { lost_id } = req.body;

  if (!lost_id) {
    return res.status(400).json({
      success: false,
      message: 'Lost ID is required'
    });
  }

  try {
    // Check if already found
    const [checkRows] = await pool.query(
      'SELECT Found_ID FROM found_item WHERE Lost_ID = ?',
      [lost_id]
    );

    if (checkRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Item is already marked as found'
      });
    }

    // Insert new found record
    const foundId = Date.now(); // temporary unique ID (better: AUTO_INCREMENT in DB)

    await pool.query(
      `INSERT INTO found_item (Found_ID, Lost_ID, Found_Time) 
       VALUES (?, ?, NOW())`,
      [foundId, lost_id]
    );

    res.json({
      success: true,
      message: 'Item marked as found successfully',
      found_id: foundId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
});

// Get all visitor entries
app.get('/api/visitor-entries', async (req, res) => {
    const query = `
        SELECT 
            Visitor_ID,
            Student_ID,
            Name,
            Phone_No,
            Relation,
            Status,
            Date
        FROM visitor_entry 
        ORDER BY Visitor_ID DESC
    `;

    try {
        const [results] = await pool.query(query);
        res.json({
            success: true,
            visitors: results,
            count: results.length
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error occurred'
        });
    }
});

// Approve visitor entry (set status = 1)
app.post('/api/approve-visitor', async (req, res) => {
    const { visitor_id } = req.body;

    if (!visitor_id) {
        return res.status(400).json({
            success: false,
            message: 'Visitor ID is required'
        });
    }

    const query = `
        UPDATE visitor_entry 
        SET Status = 1 
        WHERE Visitor_ID = ?
    `;

    try {
        const [results] = await pool.query(query, [visitor_id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Visitor entry not found'
            });
        }

        res.json({
            success: true,
            message: 'Visitor approved successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error occurred'
        });
    }
});

































// // API routes for events - FIXED VERSION
// app.get('/api/events', async (req, res) => {
//   try {
//     const sql = 'SELECT * FROM events ORDER BY Date DESC';
//     const [rows] = await pool.execute(sql);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching events:', error);
//     res.status(500).json({ error: 'Failed to fetch events' });
//   }
// });

// app.post('/api/events', async (req, res) => {
//   try {
//     const { Title, Type, Date, Description, Student_ID } = req.body;
    
//     if (!Title || !Date || !Student_ID || !Type || !Description) {
//       return res.status(400).json({ error: 'Please provide title, type, description, date, and ID' });
//     }
    
//     const sql = `
//       INSERT INTO events (Title, Type, Date, Description, Student_ID)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     const [result] = await pool.execute(sql, [Title, Type, Date, Description, Student_ID]);
    
//     // Return the correct field name that matches your frontend expectation
//     res.json({
//       success: true,
//       message: 'Event created successfully',
//       Event_ID: result.insertId  // Changed from 'eventId' to 'Event_ID'
//     });
    
//   } catch (error) {
//     console.error('Error creating event:', error);
//     res.status(500).json({ error: 'Failed to create event' });
//   }
// });











// API routes for events - UPDATED VERSION with status filtering
app.get('/api/events', async (req, res) => {
  try {
    const { student_id } = req.query; // Get student_id from query parameter
    
    let sql, params;
    
    if (student_id) {
      // If student_id is provided, show:
      // 1. All approved events (status = 1)
      // 2. User's own pending events (status = 0 AND Student_ID = student_id)
      sql = `
        SELECT *, 
               CASE 
                 WHEN Status = 0 THEN 'Pending'
                 WHEN Status = 1 THEN 'Approved'
                 ELSE 'Unknown'
               END as StatusText
        FROM events 
        WHERE Status = 1 OR (Status = 0 AND Student_ID = ?)
        ORDER BY Date ASC
      `;
      params = [parseInt(student_id)];
    } else {
      // If no student_id, only show approved events
      sql = `
        SELECT *, 
               CASE 
                 WHEN Status = 0 THEN 'Pending'
                 WHEN Status = 1 THEN 'Approved'
                 ELSE 'Unknown'
               END as StatusText
        FROM events 
        WHERE Status = 1 
        ORDER BY Date ASC
      `;
      params = [];
    }
    
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { Title, Type, Date, Description, Student_ID } = req.body;
    
    if (!Title || !Date || !Student_ID || !Type || !Description) {
      return res.status(400).json({ error: 'Please provide title, type, description, date, and ID' });
    }
    
    // New events start with status = 0 (pending)
    const sql = `
      INSERT INTO events (Title, Type, Date, Description, Student_ID, Status)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    const [result] = await pool.execute(sql, [Title, Type, Date, Description, Student_ID]);
    
    res.json({
      success: true,
      message: 'Event created successfully and is pending approval',
      Event_ID: result.insertId,
      Status: 'Pending'
    });
    
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Optional: Add route to get only user's events (for a separate "My Events" section)
app.get('/api/events/my/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    
    const sql = `
      SELECT *, 
             CASE 
               WHEN Status = 0 THEN 'Pending'
               WHEN Status = 1 THEN 'Approved'
               ELSE 'Unknown'
             END as StatusText
      FROM events 
      WHERE Student_ID = ?
      ORDER BY Date ASC
    `;
    const [rows] = await pool.execute(sql, [parseInt(student_id)]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});


























// Updated API route for lost items to match the lost_item table structure
app.post('/api/lostitems', async (req, res) => {
  try {
    const { studentId, itemId, description, lostDate } = req.body;

    // Validation - check for required fields
    if (!studentId || !itemId || !lostDate || !description) {
      return res.status(400).json({ 
        error: 'Please provide Student ID, Item ID, Description, and Date Lost' 
      });
    }

    // First, check if the student exists in the resident table
    const checkStudentSql = 'SELECT Student_ID FROM Resident WHERE Student_ID = ?';
    const [studentExists] = await pool.execute(checkStudentSql, [studentId]);
    
    if (studentExists.length === 0) {
      return res.status(400).json({ 
        error: 'Student ID not found or not a resident' 
      });
    }

    // Check if the Item_ID exists in the item table
    const checkItemSql = 'SELECT Item_ID FROM item WHERE Item_ID = ?';
    const [itemExists] = await pool.execute(checkItemSql, [itemId]);
    
    if (itemExists.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid Item ID. Please select a valid item type.' 
      });
    }

    // Convert date string to MySQL datetime format
    const lostDateTime = new Date(lostDate + ' 00:00:00');

    // Insert into lost_item table with correct column names
    const sql = `
      INSERT INTO lost_item (Student_ID, Item_ID, Description, Lost_Time)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      studentId,           // maps to Student_ID
      itemId,             // maps to Item_ID (foreign key)
      description,        // maps to Description
      lostDateTime        // maps to Lost_Time
    ]);

    res.json({
      success: true,
      message: 'Lost item reported successfully',
      lostId: result.insertId
    });

  } catch (error) {
    console.error('Error submitting lost item:', error);
    res.status(500).json({ error: 'Failed to report lost item: ' + error.message });
  }
});

// Add a route to get available item types for the dropdown
app.get('/api/item-types', async (req, res) => {
  try {
    const sql = 'SELECT Item_ID, Item_Type FROM item ORDER BY Item_Type';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching item types:', error);
    res.status(500).json({ error: 'Failed to fetch item types' });
  }
});

// Updated route to get lost items with proper joins
app.get('/api/lostitems', async (req, res) => {
  try {
    const sql = `
      SELECT 
        li.Lost_ID,
        li.Student_ID,
        si.Name as student_name,
        li.Item_ID,
        i.Item_Type,
        li.Description,
        li.Lost_Time
      FROM lost_item li
      LEFT JOIN student_Info si ON li.Student_ID = si.Student_ID 
      LEFT JOIN item i ON li.Item_ID = i.Item_ID
      ORDER BY li.Lost_Time DESC
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});


// API route to get lost items for a specific student

app.get('/api/student-lostitems/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('Fetching lost items for student:', studentId); // Debug log
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // First check if student exists
    const checkStudentSql = 'SELECT Student_ID FROM Student_Info WHERE Student_ID = ?';
    const [studentExists] = await pool.execute(checkStudentSql, [studentId]);
    
    if (studentExists.length === 0) {
      return res.json({
        success: true,
        message: 'Student ID not found',
        items: []
      });
    }

    // Query to get lost items for the student
    const sql = `
      SELECT 
        li.Lost_ID,
        li.Student_ID,
        si.Name as student_name,
        li.Item_ID,
        i.Item_Type,
        li.Description,
        li.Lost_Time
      FROM lost_item li
      LEFT JOIN Student_Info si ON li.Student_ID = si.Student_ID 
      LEFT JOIN item i ON li.Item_ID = i.Item_ID
      WHERE li.Student_ID = ?
      ORDER BY li.Lost_Time DESC
    `;
    
    console.log('Executing query:', sql); // Debug log
    console.log('With parameter:', studentId); // Debug log
    
    const [rows] = await pool.execute(sql, [studentId]);
    
    console.log('Query result:', rows); // Debug log
    
    res.json({
      success: true,
      items: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('Error fetching student lost items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lost items: ' + error.message 
    });
  }
});


// API route to fetch found items by Lost ID

// Replace the existing /api/founditems/:lostId endpoint in your server.js with this corrected version

app.get('/api/founditems/:lostId', async (req, res) => {
  try {
    const { lostId } = req.params;
    
    console.log('Looking up Lost ID:', lostId); // Debug log
    
    const sql = `
      SELECT 
        fi.Found_ID,
        fi.Lost_ID,
        fi.Found_Time,
        li.Student_ID,
        si.Name as student_name,
        li.Description,
        li.Lost_Time,
        i.Item_Type
      FROM found_item fi
      JOIN lost_item li ON fi.Lost_ID = li.Lost_ID
      LEFT JOIN Student_Info si ON li.Student_ID = si.Student_ID
      LEFT JOIN item i ON li.Item_ID = i.Item_ID
      WHERE fi.Lost_ID = ?
      ORDER BY fi.Found_Time DESC
    `;
    
    const [rows] = await pool.execute(sql, [lostId]);
    
    console.log('Query result:', rows); // Debug log
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ error: 'Failed to fetch found items: ' + error.message });
  }
});







// API routes for allocation info
app.get('/api/allocations', async (req, res) => {
  try {
    const { student_id } = req.query;
    let sql = `
      SELECT 
        ra.Hall_No AS Hall_No,
        ha.Place AS Hall_Place,
        ra.Room_No AS Room_No,
        ra.Alloc_Start_Time AS Alloc_Start_Time,
        ra.Alloc_End_Time AS Alloc_End_Time
      FROM room_allocation ra
      LEFT JOIN hall ha ON ra.Hall_No = ha.Hall_No
    `;

    let params = [];
    
    if (student_id) {
      sql += ' WHERE ra.Student_ID = ?';
      params.push(student_id);
    }
    
    sql += ' ORDER BY ra.Alloc_Start_Time DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// app.post('/api/allocations', async (req, res) => {
//   try {
//     const { student_id, room_number, building, allocation_date, fee_status } = req.body;

//     if (!student_id || !room_number || !building) {
//       return res.status(400).json({ error: 'Please provide student ID, room number, and building' });
//     }

//     const sql = `
//       INSERT INTO Room_Allocations (student_id, room_number, building, allocation_date, fee_status)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     const [result] = await pool.execute(sql, [student_id, room_number, building, allocation_date, fee_status || 'unpaid']);

//     res.json({
//       success: true,
//       message: 'Room allocation created successfully',
//       allocationId: result.insertId
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to create allocation' });
//   }
// });

// API routes for visitor applications
// Essential API endpoint for visitor entry submission
app.post('/api/visitor-entry', async (req, res) => {
  try {
    console.log('Received visitor entry request:', req.body);
    
    const { studentId, visitorName, visitorPhone, relation } = req.body;

    // Basic validation
    if (!studentId || !visitorName || !visitorPhone || !relation) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: Student ID, Visitor Name, Phone Number, and Relation.' 
      });
    }

    // Insert into database
    const sql = `
      INSERT INTO visitor_entry (Student_ID, Name, Phone_No, Relation)
      VALUES (?, ?, ?, ?)
    `;
    
    console.log('Executing SQL:', sql);
    console.log('With values:', [studentId, visitorName, visitorPhone, relation]);
    
    const [result] = await pool.execute(sql, [
      studentId,
      visitorName,
      visitorPhone,
      relation
    ]);

    console.log('Database insert successful, ID:', result.insertId);

    res.json({
      success: true,
      message: 'Visitor entry submitted successfully!',
      visitorId: result.insertId
    });

  } catch (error) {
    console.error('Visitor Entry Database Error:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        success: false,
        error: 'Visitor_Entry table does not exist. Please check database setup.' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        success: false,
        error: 'Database column mismatch. Please check table structure.' 
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Student ID. Student not found in system.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// API routes for visitor status
// Add this route to your server.js file after your existing visitor entry routes

// API route to get visitor entries for a specific student with Status column
app.get('/api/visitor-entries-by-student', async (req, res) => {
  try {
    const { student_id } = req.query;
    
    console.log('Fetching visitor entries for student:', student_id);
    
    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    // First check if student exists
    const checkStudentSql = 'SELECT Student_ID FROM Student_Info WHERE Student_ID = ?';
    const [studentExists] = await pool.execute(checkStudentSql, [student_id]);
    
    if (studentExists.length === 0) {
      return res.json({
        success: true,
        message: 'Student ID not found',
        entries: []
      });
    }

    // Query to get visitor entries for the student from Visitor_Entry
    const sql = `
      SELECT 
        ve.Visitor_ID,
        ve.Student_ID,
        ve.Name,
        ve.Phone_No,
        ve.Relation,
        ve.Status,
        si.Name as student_name
      FROM visitor_entry ve
      LEFT JOIN Student_Info si ON ve.Student_ID = si.Student_ID 
      WHERE ve.Student_ID = ?
      ORDER BY ve.Visitor_ID DESC
    `;
    
    console.log('Executing query:', sql);
    console.log('With parameter:', student_id);
    
    const [rows] = await pool.execute(sql, [student_id]);
    
    console.log('Query result:', rows);
    
    res.json({
      success: true,
      message: 'Visitor entries fetched successfully',
      entries: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('Error fetching student visitor entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor entries: ' + error.message
    });
  }
});

// API route to fetch items from the 'item' table
// Replace your existing /api/items endpoint with this:
app.get('/api/items', async (req, res) => {
  try {
    const sql = 'SELECT * FROM item ORDER BY item_id ASC'; // Use your actual table structure
    const [rows] = await pool.execute(sql);
    
    console.log('Database query result:', rows); // Debug log
    
    // Return consistent structure
    res.json({
      success: true,
      items: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
});


// Clean API route for dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { student_id } = req.query;
    const stats = {};

     const [lostItems] = await pool.execute('SELECT COUNT(*) as count FROM lost_item WHERE student_id = ?', [student_id]);
    stats.totalLostItems = lostItems[0].count;

    const [foundItems] = await pool.execute(
    `SELECT COUNT(*) as count 
    FROM found_item f
    JOIN lost_item l ON f.lost_id = l.lost_id
    WHERE l.student_id = ?`, [student_id]);
    stats.totalFoundItems = foundItems[0].count;

    const [events] = await pool.execute('SELECT COUNT(*) as count FROM events WHERE Status = 1');
    stats.totalEvents = events[0].count;

    const [complaints] = await pool.execute('SELECT COUNT(*) as count FROM complaint WHERE student_id = ?', [student_id]);
    stats.totalComplaints = complaints[0].count;

    const [pendingComplaints] = await pool.execute('SELECT COUNT(*) as count FROM complaint WHERE status = 0 AND student_id = ?', [student_id]);
    stats.pendingComplaints = pendingComplaints[0].count;
    
    
    
    // Total students
    try {
      const [totalStudents] = await pool.execute('SELECT COUNT(*) as count FROM Student_Info');
      stats.totalStudents = totalStudents[0].count;
    } catch (studentsError) {
      try {
        const [totalStudents] = await pool.execute('SELECT COUNT(*) as count FROM student_info');
        stats.totalStudents = totalStudents[0].count;
      } catch (altError) {
        stats.totalStudents = 0;
      }
    }
    
    // User specific stats if student_id provided
    if (student_id) {
      try {
        const [userLostItems] = await pool.execute('SELECT COUNT(*) as count FROM lost_item WHERE Student_ID = ?', [student_id]);
        stats.userLostItems = userLostItems[0].count;
      } catch (error) {
        stats.userLostItems = 0;
      }
      
      try {
        const [userFoundItems] = await pool.execute('SELECT COUNT(*) as count FROM Found_Items WHERE student_id = ?', [student_id]);
        stats.userFoundItems = userFoundItems[0].count;
      } catch (error) {
        stats.userFoundItems = 0;
      }
      
      try {
        const [userComplaints] = await pool.execute('SELECT COUNT(*) as count FROM complaint WHERE student_id = ?', [student_id]);
        stats.userComplaints = userComplaints[0].count;
      } catch (error) {
        stats.userComplaints = 0;
      }
    }
    
    res.json(stats);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard statistics: ' + error.message });
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