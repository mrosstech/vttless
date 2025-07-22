# Deployment Guide

## Railway Staging Environment Setup

### Prerequisites
1. Create a [Railway](https://railway.app) account
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

### Initial Setup

1. **Create Railway Project**
   ```bash
   railway login
   cd /path/to/vttless
   railway init
   ```

2. **Create Three Services**
   - Backend API (Node.js)
   - Frontend Client (Nginx/React)
   - Event Server (Socket.io)
   - MongoDB Database

3. **Set Environment Variables**
   
   For each service in Railway dashboard:
   
   **Backend Service:**
   ```
   MONGODB_URI=mongodb://mongo:27017/vttless
   JWT_SECRET=your-jwt-secret-here
   MONGO_SESSION_SECRET=your-session-secret
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket
   CLIENT_URL=https://your-client-url.railway.app
   PORT=5000
   ```
   
   **Event Server:**
   ```
   PORT=3001
   ```
   
   **Client (Frontend):**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   REACT_APP_SOCKET_URL=https://your-eventserver-url.railway.app
   ```

4. **Deploy Services**
   
   Each service uses its respective Dockerfile:
   - Backend: `Dockerfile.backend`
   - Client: `Dockerfile.client` 
   - EventServer: `Dockerfile.eventserver`

### GitHub Actions Setup

1. **Add Railway Token to GitHub Secrets**
   - Go to Railway dashboard → Account → Tokens
   - Create new token
   - Add to GitHub repo: Settings → Secrets → Actions
   - Name: `RAILWAY_TOKEN`

2. **Service Names in Railway**
   Update the service names in `.github/workflows/deploy-staging.yml` to match your Railway services:
   ```yaml
   service: your-backend-service-name
   service: your-client-service-name  
   service: your-eventserver-service-name
   ```

### Manual Deployment Commands

```bash
# Deploy backend
railway up -s backend-service-name -f Dockerfile.backend

# Deploy client
railway up -s client-service-name -f Dockerfile.client

# Deploy eventserver  
railway up -s eventserver-service-name -f Dockerfile.eventserver
```

### Database Setup

Railway provides managed MongoDB. Connect via:
1. Add MongoDB service in Railway dashboard
2. Copy connection string to `MONGODB_URI` environment variable

### Post-Deployment

1. **Update CORS settings** in backend to allow your Railway domain
2. **Update Socket.io origins** in eventserver
3. **Test all endpoints** work with new URLs
4. **Verify file uploads** work with S3

### Monitoring

- View logs: `railway logs -s service-name`
- View metrics in Railway dashboard
- Set up health checks for each service

### Cost Estimation

**Monthly costs for staging:**
- 3 services: ~$15-20/month
- MongoDB: ~$5/month  
- Total: ~$20-25/month

### Troubleshooting

**Common Issues:**
- CORS errors: Update backend CORS settings
- Socket connection fails: Check eventserver URL in client
- File upload fails: Verify S3 credentials and bucket permissions
- Build fails: Check Dockerfile paths and dependencies