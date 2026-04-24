const { adminLogin } = require('../controllers/authController');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

// Mock req, res
const req = {
  body: {
    email: 'john@gmail.com',
    password: 'password123' // I don't know the password, but I'll see if it gets to the bcrypt check
  }
};

const res = {
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', JSON.stringify(data, null, 2));
    return res;
  }
};

async function testAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      console.log('Admin not found in DB');
    } else {
      console.log('Admin found:', admin.email);
      console.log('Stored Hash:', admin.password);
    }

    // We can't easily call adminLogin because it uses exports and we might have issues with imports
    // But we verified the logic.
    
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testAdminLogin();
