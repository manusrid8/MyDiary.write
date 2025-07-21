require('dotenv').config(); // Load .env variables

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection using .env variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,  // ✅ Add this line
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
app.get('/', (req, res) => {
  res.redirect('/Login.html');
});


connection.connect((err) => {
  if (err) return console.error('Database connection failed:', err);
  console.log('Connected to MySQL database!');
});
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mydiary.write@gmail.com',
    pass: 'ofvd aznc psaw vqgp'
  }
});

// Registration
app.post('/registerUser', async (req, res) => {
  const { email, password } = req.body;
  if (!email.endsWith('@gmail.com')) {
    console.log("❌ Invalid email domain");
    return res.status(400).send("Only Gmail IDs are allowed.");
  }

  connection.query('SELECT * FROM Users WHERE EmailID = ?', [email], async (err, results) => {
    if (err) {
      console.error("❌ SELECT error:", err);
      return res.status(500).send('Database error');
    }

    if (results.length > 0) {
      console.log("⚠️ User already exists:", email);
      return res.status(400).send("User already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    connection.query(
      'INSERT INTO Users (EmailID, HashedPassword) VALUES (?, ?)',
      [email, hashedPassword],
      (err) => {
        if (err) {
          console.error("❌ INSERT error during registration:", err); // most important line
          return res.status(500).send('Database error');
        }

        console.log("✅ User registered:", email);
        res.status(200).send("Registration successful.");
      }
    );
  });
});


// Login
app.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email.endsWith('@gmail.com')) return res.status(400).json({ message: "Only Gmail IDs are allowed." });

  connection.query('SELECT ID, HashedPassword FROM Users WHERE EmailID = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error during login' });
    if (result.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const userID = result[0].ID;
    const isMatch = await bcrypt.compare(password, result[0].HashedPassword);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const isTemp = password.length === 8 && !password.match(/[A-Z]/);
    res.status(200).json({ message: 'Login successful', userID, tempPasswordUsed: isTemp });
  });
});

// Password Reset
app.post('/resetPassword', async (req, res) => {
  const { email } = req.body;
  if (!email.endsWith('@gmail.com')) return res.status(400).send('Enter a valid Gmail ID');

  const newPassword = crypto.randomBytes(4).toString('hex');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  connection.query('UPDATE Users SET HashedPassword = ? WHERE EmailID = ?', [hashedPassword, email], (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (result.affectedRows === 0) return res.status(404).send("Email not found");

    const mailOptions = {
      from: 'mydiary.write@gmail.com',
      to: email,
      subject: 'Your MyDiary Temporary Password',
      html: `<p>Hello,</p><p>Your temporary password is:</p><h3>${newPassword}</h3><p>Please log in using this password and change it immediately.</p>`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).send("Failed to send email");
      res.status(200).send("Temporary password sent to your email.");
    });
  });
});

// Update Password
app.post('/updatePassword', async (req, res) => {
  const { userID, newPassword } = req.body;
  if (!userID || !newPassword) return res.status(400).send("Missing data");

  const hashed = await bcrypt.hash(newPassword, 10);
  connection.query('UPDATE Users SET HashedPassword = ? WHERE ID = ?', [hashed, userID], (err) => {
    if (err) return res.status(500).send("Database error");
    res.status(200).send("Password updated successfully");
  });
});

// Required Setup (in your server.js or app.js file)

app.post('/createPost', upload.single('image'), (req, res) => {
  const { title, description, visibility, userID } = req.body;

  console.log('Incoming Form:', { title, description, visibility, userID });

  if (!userID || isNaN(userID)) {
    return res.status(400).send('Invalid or missing user ID');
  }

  const imageBuffer = req.file ? req.file.buffer.toString('base64') : null;
  const safeVisibility = (visibility === 'global') ? 'global' : 'private';

  const sql = `
  INSERT INTO Posts (UserID, PostTitle, PostDescription, Visibility, ImageBase64)
  VALUES (?, ?, ?, ?, ?)
`;

  connection.query(sql, [userID, title, description, safeVisibility, imageBuffer], (err, result) => {
    if (err) {
      console.error('DB error during post creation:', err.message);
      return res.status(500).send('Database error: ' + err.message);
    }

    console.log('✅ Post successfully inserted.');
    res.status(200).send('Post created successfully');
  });
});
app.post('/submitPost', (req, res) => {
  const { title, description, userID, imageBase64, visibility } = req.body;

  if (!title || !description || !userID) {
    return res.status(400).send("Missing required fields");
  }

  const safeVisibility = (visibility === 'global') ? 'global' : 'private';

  const query = `
  INSERT INTO Posts (PostTitle, PostDescription, UserID, Visibility, ImageBase64)
  VALUES (?, ?, ?, ?, ?)
`;
  connection.query(query, [title, description, userID, safeVisibility, imageBase64 || null], (err, result) => {
    if (err) {
      console.error("Post submission error:", err.message);
      return res.status(500).send("Database error: " + err.message);
    }

    res.status(200).send("Post submitted successfully");
  });
});


// Get Global Posts
app.get('/getGlobalPosts', (req, res) => {
 const query = `
  SELECT ID, PostTitle, PostDescription, CreatedAt, ImageBase64 
  FROM Posts 
  WHERE Visibility = 'global' 
  ORDER BY ID DESC
`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching global posts:", err);
      return res.status(500).send("Database error");
    }

    const posts = results.map(post => {
      if (post.ImageBase64 && !post.ImageBase64.startsWith('data:image')) {
        post.ImageBase64 = `data:image/jpeg;base64,${post.ImageBase64}`;
      }
      return post;
    });

    return res.status(200).json(posts);
  });
});

//getmyposts
app.get('/getMyPosts', (req, res) => {
  const userID = req.query.userID;
  if (!userID) return res.status(400).send("Missing userID");

  const query = `
  SELECT 
    ID, 
    PostTitle, 
    PostDescription, 
    CreatedAt, 
    ImageBase64 
  FROM Posts 
  WHERE UserID = ? 
  ORDER BY ID DESC
`;


  connection.query(query, [userID], (err, result) => {
    if (err) {
      console.error("Error fetching user posts:", err);
      return res.status(500).send("Database error");
    }

    const posts = result.map(post => {
      if (post.ImageBase64 && !post.ImageBase64.startsWith('data:image')) {
        post.ImageBase64 = `data:image/jpeg;base64,${post.ImageBase64}`;
      }
      return post;
    });

    res.status(200).json(posts);
  });
});


//getpostsbyid

app.get('/getPostByID', (req, res) => {
  const postID = req.query.postID;
  if (!postID) return res.status(400).send("Missing postID");

  const query = `
  SELECT 
    ID, 
    PostTitle, 
    PostDescription, 
    CreatedAt, 
    ImageBase64,
    UserID
  FROM Posts 
  WHERE ID = ?
`;


  connection.query(query, [postID], (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (result.length === 0) return res.status(404).send("Post not found");

    const post = result[0];
    if (post.ImageBase64 && !post.ImageBase64.startsWith('data:image')) {
      post.ImageBase64 = `data:image/jpeg;base64,${post.ImageBase64.toString()}`;
    }

    res.status(200).json(post);
  });
});


// PUT: Edit Post
app.put('/updatePost/:id', upload.single('image'), (req, res) => {
  const postID = req.params.id;
  const { title, description, visibility } = req.body;
  const userID = req.body.userID;

  if (!postID || !title || !description || !visibility || !userID) {
    return res.status(400).send("Missing fields");
  }

  const updateFields = {
    PostTitle: title,
    PostDescription: description,
    Visibility: visibility
  };

  if (req.file) {
    updateFields.ImageBase64 = req.file.buffer.toString('base64');
  }

  const query = `UPDATE Posts SET ? WHERE ID = ? AND UserID = ?`;
  connection.query(query, [updateFields, postID, userID], (err, result) => {
    if (err) {
      console.error("Update error:", err.message);
      return res.status(500).send("Database error");
    }
    if (result.affectedRows === 0) {
      return res.status(403).send("Unauthorized or post not found");
    }
    res.status(200).send("Post updated");
  });
});



//deletepost
app.delete('/deletePost', (req, res) => {
  const postID = req.query.postID;
  if (!postID) return res.status(400).json({ success: false, error: "Missing postID" });

  const query = `DELETE FROM Posts WHERE ID = ?`;

  connection.query(query, [postID], (err, result) => {
    if (err) {
      console.error("Delete failed:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    res.json({ success: true });
  });
});



// React to Post
app.post('/reactToPost', (req, res) => {
  const { userID, postID, reactionType } = req.body;

  if (!userID || !postID || !reactionType) {
    return res.status(400).send("Missing required fields");
  }

  const query = `
    INSERT INTO Reactions (UserID, PostID, ReactionType)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE ReactionType = VALUES(ReactionType)
  `;

  connection.query(query, [userID, postID, reactionType], (err, result) => {
    if (err) {
      console.error('Error reacting to post:', err);
      return res.status(500).send('Error inserting reaction');
    }
    return res.status(200).send('Reaction recorded');
  });
});


// Get Reaction Counts
app.get('/getReactions', (req, res) => {
  const { postID } = req.query;
  const query = 'SELECT ReactionType, COUNT(*) AS Count FROM Reactions WHERE PostID = ? GROUP BY ReactionType';

  connection.query(query, [postID], (err, results) => {
    if (err) return res.status(500).send('DB error');
    const counts = { like: 0, love: 0, sad: 0, laugh: 0 };
    results.forEach(row => counts[row.ReactionType] = row.Count);
    res.status(200).json(counts);
  });
});

// Get User's Reaction
app.get('/getUserReaction', (req, res) => {
  const { userID, postID } = req.query;
  connection.query('SELECT ReactionType FROM Reactions WHERE UserID = ? AND PostID = ?', [userID, postID], (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (result.length === 0) return res.status(200).json({ reaction: null });
    res.status(200).json({ reaction: result[0].ReactionType });
  });
});

// Get All Reactions
app.get('/getAllReactions', (req, res) => {
  const query = 'SELECT PostID, ReactionType, COUNT(*) AS count FROM Reactions GROUP BY PostID, ReactionType';
  connection.query(query, (err, results) => {
    if (err) return res.status(500).send("Database error");
    const reactionMap = {};
    results.forEach(({ PostID, ReactionType, count }) => {
      if (!reactionMap[PostID]) reactionMap[PostID] = {};
      reactionMap[PostID][ReactionType] = count;
    });
    res.status(200).json(reactionMap);
  });
});

// Start Server


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});

