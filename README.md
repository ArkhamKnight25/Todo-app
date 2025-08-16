# TaskFlow - Asana-Inspired Todo Application

A modern, full-stack todo application built with Next.js 14+, TypeScript, Tailwind CSS, and PostgreSQL. Inspired by Asana's design philosophy with enterprise-grade features.

🌐 **Live Demo**: [https://todo-god.vercel.app](https://todo-god.vercel.app)

## 🚀 Features

### ✅ Implemented
- **Authentication System**: JWT-based auth with registration and login
- **Project Management**: Complete CRUD operations for projects with workspace support
- **Database Schema**: Complete Prisma schema with PostgreSQL
- **Modern UI**: Tailwind CSS with responsive design
- **TypeScript**: Full type safety throughout the application
- **Production Deployment**: Deployed on Vercel with custom domain
- **API Integration**: RESTful APIs for projects, tasks, and sections

### 🚧 In Development
- Task management with CRUD operations
- Real-time collaboration
- Kanban board view
- Calendar integration
- Dashboard with analytics
- Dark mode theme

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL v17 with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **UI Components**: Custom components with Lucide icons
- **Deployment**: Vercel with custom domain
- **State Management**: Zustand for client-side state

## 📦 Installation

1. **Clone the repository** (or use existing folder)
   ```bash
   cd Todo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local` and update with your database URL
   - Generate secure JWT secrets (32+ characters)
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/asana_todo"
   JWT_SECRET="your-super-secret-jwt-key-32-chars"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database (for development)
   npx prisma db push
   
   # Or run migrations (for production)
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗 Project Structure

```
Todo/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication utilities
│   │   ├── jwt.ts        # JWT token management
│   │   └── password.ts   # Password hashing
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database schema
├── components/           # React components (to be added)
├── store/               # State management (to be added)
└── public/              # Static assets
```

## 🔐 Authentication Flow

1. **Registration**: Users create account with email/password
2. **Login**: JWT access token (15min) + refresh token (7 days)
3. **Sessions**: Refresh tokens stored in database with expiration
4. **Security**: Passwords hashed with bcrypt, tokens signed with secrets

## 🗄 Database Schema

The application uses a comprehensive schema including:
- **Users**: Authentication and profile data
- **Workspaces**: Team collaboration spaces
- **Projects**: Project organization within workspaces
- **Tasks**: Core task management with status, priority, assignments
- **Comments**: Task collaboration
- **Tags & Attachments**: Enhanced task metadata

## 🚀 Deployment

### Live Application
- **URL**: [https://todo-god.vercel.app](https://todo-god.vercel.app)
- **Platform**: Vercel with automatic deployments
- **Custom Domain**: Configured with Vercel alias system

### Deployment Process
1. **GitHub Integration**: Connected repository for automatic deployments
2. **Build Configuration**: Custom build script with Prisma generation
3. **Environment Variables**: Production environment configured
4. **Domain Aliasing**: `vercel alias [deployment-url] todo-god.vercel.app`

### Environment Variables for Production
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="your-production-jwt-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"
NEXTAUTH_URL="https://todo-god.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
NODE_ENV="production"
```

### Build Script
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## 📱 Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js project setup
- [x] Authentication system  
- [x] Database schema
- [x] Basic UI components
- [x] Production deployment
- [x] Custom domain setup

### Phase 2: Core Features ✅ 
- [x] Project CRUD operations
- [x] Project management API
- [x] Dashboard with navigation
- [x] Project cards and list views
- [x] Workspace integration
- [ ] Task CRUD operations (In Progress)
- [ ] Kanban board implementation

### Phase 3: Advanced Features (Planned)
- [ ] Dark mode theme
- [ ] Real-time collaboration
- [ ] Calendar integration
- [ ] File attachments
- [ ] Advanced search and filters

### Phase 4: Polish
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Testing suite
- [ ] Documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include error messages and environment details

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
