export const adminLogin = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
  
    if (email === 'admin@atlas.com' && password === 'admin123') {
      // Create JWT-like token with user data in payload
      const mockJwtPayload = {
        user: {
          id: 1,
          email: 'admin@atlas.com',
          username: 'admin',
          isAdmin: true,
          isVerified: true,
          teamId: null
        },
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
        iat: Math.floor(Date.now() / 1000)
      };
  
      // Base64 encode the payload to simulate JWT structure
      const encodedPayload = btoa(JSON.stringify(mockJwtPayload));
      const mockJwt = `header.${encodedPayload}.signature`;
  
      return {
        refresh: 'mock_refresh_token',
        access: mockJwt,
        user: mockJwtPayload.user
      };
    }
  
    throw new Error('Invalid admin credentials');
  };