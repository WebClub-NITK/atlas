# Atlas CTF Platform Frontend

Atlas is a modern Capture The Flag (CTF) platform built with React, Vite, and Tailwind CSS. This project is currently under active development.

## 🚦 Getting Started

1. **Clone and Install**

```bash
git clone atlas
cd frontend-routes
pnpm install
```

2. **env setup**

```bash
touch .env
```

3. **Development**

```bash
pnpm dev
```

4. **Build**

```bash
pnpm build
pnpm preview
```

## 📁️ Tech Stack

- **Core**: React 18, Vite
- **Styling**: Tailwind CSS (UI library improvements planned)
- **Routing**: React Router v6
- **API**: Axios
- **Type Checking**: PropTypes

## 📁 Project Structure

```
src/
├── api/          # API integration
├── components/   # Reusable components
├── context/      # React context (Auth)
├── hooks/        # Custom hooks
├── pages/        # Route components
└── styles/       # CSS & Tailwind
```

## 🔒 Protected Routes

The following routes require authentication:

```javascript:src/App.jsx
startLine: 26
endLine: 49
```

### Protected Route Implementation

The `ProtectedRoute` component (`src/components/ProtectedRoute.jsx`) handles route protection by:

- Using the `useAuth` hook to check authentication status
- Showing a loading state during auth checks
- Redirecting unauthorized users to the login page
- Rendering protected content for authenticated users

### Unauthorized Access Restrictions

Users who are not logged in cannot access:

- Challenge features:

  - Viewing available challenges
  - Submitting flags
  - Tracking solved challenges

- Team features:

  - Creating new teams
  - Joining existing teams
  - Viewing team information
  - Managing team membership

- Competition features:
  - Viewing the scoreboard
  - Tracking team rankings
  - Viewing competition progress

## 🤝 Contributing

```markdown
## Contribution Guidelines  

1. Fork the repo.  
2. Checkout frontend-routes (already created)
3. Make changes and test locally:  
4. Push to frontend-routes:  
5. Open a PR to merge into main.  
```

### Key Areas for Contribution

- UI/UX improvements
- Authentication flow
- Protected routes enhancement
- Test coverage
- Documentation

### Setup Notes

- Node.js 16+ required
- Using pnpm for package management
- Vite for development server

## 🔄 Current Status

This project is in active development. Key areas in progress:

- Enhanced UI components
- Improved authentication flow
- Additional protected routes
