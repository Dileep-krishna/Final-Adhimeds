import StaffMember from '../model/staffmanagementModel.js';
import jwt from 'jsonwebtoken';

export const staffLogin = async (req, res) => {
  console.log('\n========== STAFF LOGIN ATTEMPT ==========');
  console.log('Request body:', { ...req.body, password: '***' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('❌ Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    console.log(`🔍 Looking for staff with email: "${email}" (lowercase query)`);
    
    // Populate the role field to get the role name
    const staff = await StaffMember.findOne({ email: email.toLowerCase() })
      .populate('role', 'name');
    
    if (!staff) {
      console.warn(`❌ No staff found with email: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log(`✅ Staff found: ${staff.fullName} (ID: ${staff._id})`);
    console.log(`   - Role: ${staff.role?.name || staff.role} (type: ${typeof staff.role})`);
    console.log(`   - Status: ${staff.status}`);
    console.log(`   - District: ${staff.district || 'Not set'}`);
    console.log(`   - Has password hash: ${!!staff.password}`);

    if (staff.status !== 'active') {
      console.warn(`⚠️ Staff account is not active. Status: ${staff.status}`);
      return res.status(401).json({ success: false, message: 'Account is not active. Please contact admin.' });
    }

    console.log('🔐 Verifying password...');
    const isMatch = await staff.comparePassword(password);
    console.log(`   Password match result: ${isMatch}`);

    if (!isMatch) {
      console.warn(`❌ Password mismatch for staff: ${staff.email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get role name from populated field or fallback
    const roleName = staff.role?.name || staff.role;
    console.log(`   Role resolved: ${roleName}`);

    const tokenPayload = {
      id: staff._id,
      role: roleName,
      fullName: staff.fullName,
    };
    console.log('📝 JWT payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );
    console.log('✅ JWT generated successfully');

    console.log(`🎉 Staff login successful: ${staff.fullName} (${staff.email})`);
    console.log('==========================================\n');

    // ✅ Include district in the response
    res.status(200).json({
      success: true,
      data: {
        token,
        role: roleName,
        fullName: staff.fullName,
        _id: staff._id,
        district: staff.district || null,   // <-- now sent to frontend
      },
    });
  } catch (error) {
    console.error('\n========== STAFF LOGIN ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('==========================================\n');
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};