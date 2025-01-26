export const adminLogin = async (email, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (email === 'admin@atlas.com' && password === 'admin123') {
    // Create JWT-like token with user data in payload
    const mockJwtPayload = {
      user_id: 1,
      email: 'admin@atlas.com',
      username: 'admin',
      is_admin: true,
      is_verified: true,
      team_id: null,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
      iat: Math.floor(Date.now() / 1000)
    };

    // Base64 encode the payload to simulate JWT structure
    const encodedPayload = btoa(JSON.stringify(mockJwtPayload));
    const mockJwt = `header.${encodedPayload}.signature`;

    return {
      access: mockJwt,  // Direct properties instead of nested under 'token'
      refresh: 'mock_refresh_token',
      user: {
        id: mockJwtPayload.user_id,
        email: mockJwtPayload.email,
        username: mockJwtPayload.username,
        isAdmin: true,
        isVerified: mockJwtPayload.is_verified
      }
    };
  }

  throw new Error('Invalid admin credentials');
};