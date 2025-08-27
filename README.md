# Yikes Password Manager

A **self-hosted, zero-knowledge password manager** with strong encryption, modern web interface, and browser extension support. Built with security and privacy as the top priorities.

## Features

### Security & Privacy
- **Zero-Knowledge Architecture**: Your master password never leaves your device
- **AES-256-GCM Encryption**: Military-grade encryption for all sensitive data
- **PBKDF2 Key Derivation**: 100,000 iterations for master key generation
- **Client-Side Encryption**: All encryption/decryption happens in your browser
- **Two-Factor Authentication**: TOTP support for enhanced security
- **Security Audit Logging**: Track all access and changes

### Core Functionality
- **Password Management**: Store, organize, and search credentials
- **Folder Organization**: Hierarchical organization with custom colors
- **Tagging System**: Flexible categorization and filtering
- **Password Generation**: Secure random password generation
- **Password History**: Track password changes over time
- **Favorites**: Quick access to frequently used credentials


## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Web App       │    │   Extension     │
│   Extension     │◄──►│   (React)       │◄──►│   (WebExtension)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Server (Express.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Auth      │  │ Credentials │  │     WebSocket           │ │
│  │ Controller  │  │ Controller  │  │     Real-time Sync      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    │  (Encrypted Data)   │
                    └─────────────────────┘
```

## Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **PostgreSQL** 12+
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/yikes-password-manager.git
cd yikes-password-manager
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb yikes_password_manager

# Run database migrations
npm run db:migrate
```

### 4. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yikes_password_manager
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
BCRYPT_ROUNDS=12

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 5. Start Development Servers
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run dev:server    # Backend on port 3001
npm run dev:client    # Frontend on port 3000
```

### 6. Access the Application
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Browser Extension Setup

### 1. Build the Extension
```bash
cd extension
npm install
npm run build
```

### 2. Load in Browser
- **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked"
- **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on"

### 3. Configure Extension
- Set your server URL in extension settings
- Login with your credentials
- Start using autofill on websites

## Security Features

### Encryption Details
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-512, 100,000 iterations
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes)
- **Authentication**: GCM provides both encryption and integrity

### Zero-Knowledge Architecture
1. **Master Key Generation**: Derived from password + salt using PBKDF2
2. **Client-Side Encryption**: All data encrypted before leaving browser
3. **Server Storage**: Only encrypted ciphertext stored on server
4. **Decryption**: Happens entirely in client browser

### Security Best Practices
- **HTTPS Only**: All communication encrypted in transit
- **Rate Limiting**: Protection against brute force attacks
- **Session Management**: Secure JWT tokens with expiration
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📚 API Documentation

### Authentication Endpoints
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
POST /api/v1/auth/refresh
```

### Credentials Endpoints
```http
GET    /api/v1/credentials
POST   /api/v1/credentials
GET    /api/v1/credentials/:id
PUT    /api/v1/credentials/:id
DELETE /api/v1/credentials/:id
GET    /api/v1/credentials/search
POST   /api/v1/credentials/:id/favorite
GET    /api/v1/credentials/stats
```

### Protected Routes
All sensitive endpoints require authentication via JWT token:
```http
Authorization: Bearer <your-jwt-token>
```

## 🚀 Production Deployment

### 1. Build Production Assets
```bash
npm run build
```

### 2. Environment Setup
```bash
NODE_ENV=production
DB_SSL=true
JWT_SECRET=<strong-random-secret>
```

### 3. Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start dist/server/index.js --name "yikes-password-manager"

# Using Docker (Dockerfile provided)
docker build -t yikes-password-manager .
docker run -p 3001:3001 yikes-password-manager
```

### 4. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Security tests
npm run test:security
```

### Test Coverage
```bash
npm run test:coverage
```

## Monitoring & Logging

### Health Checks
- **Endpoint**: `/health`
- **Database**: Connection status
- **Memory**: Usage monitoring
- **Uptime**: Service availability

### Security Audit Log
All security-relevant events are logged:
- Login attempts (success/failure)
- Password changes
- Credential access
- Administrative actions

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Security Guidelines
- Never commit secrets or API keys
- Follow OWASP security guidelines
- All new features require security review
- Maintain zero-knowledge architecture

## License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

The AGPL license ensures:
- **Transparency**: Source code remains open
- **Server Freedom**: Users can modify and run their own instances
- **Community**: Contributions benefit everyone
- **Privacy**: No vendor lock-in or data mining


## 🙏 Acknowledgments

- **Cryptography**: Node.js crypto module and Web Crypto API
- **UI Components**: Headless UI and Heroicons
- **Security**: OWASP guidelines and security best practices
- **Community**: Open source contributors and security researchers

## 🔮 Roadmap

### Short Term (v1.1)
- [ ] Password sharing between users
- [ ] Advanced search filters
- [ ] Import/export functionality
- [ ] Mobile app (React Native)

### Medium Term (v1.2)
- [ ] Biometric authentication
- [ ] Hardware security key support
- [ ] Advanced reporting and analytics
- [ ] API rate limiting improvements

### Long Term (v2.0)
- [ ] Multi-tenant support
- [ ] Advanced RBAC
- [ ] Audit compliance features
- [ ] Enterprise SSO integration

---

**⚠️ Security Notice**: This is security software. Please:
- Review the code before deployment
- Keep dependencies updated
- Monitor security advisories
- Report vulnerabilities responsibly

**🔐 Remember**: Your security is only as strong as your master password. Choose wisely!
