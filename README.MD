# E-Commerce Project

## Technologies Used

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui for component library
- React Query for data fetching
- Axios for HTTP requests
- React Router for navigation

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL Database)
- JWT for authentication
- HTTP-Only Cookies for security

## Project Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation Steps

1. Clone the repository
```bash
git clone [repository-url]
cd e-commerce

# Install backend dependencies
npm install

# Backend (.env)
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret

# Start backend (in backend directory)
npm run dev