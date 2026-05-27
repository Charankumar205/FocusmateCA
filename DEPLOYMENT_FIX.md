# FocusMate Deployment Fix Guide

## Problem Identified
Your React app deployment was failing with `sh: 1: react-scripts: Permission denied` because:
- **node_modules folder was tracked in git** (with Windows file permissions)
- Permission issues occur when deployed to Linux-based systems (Render/Vercel)
- This breaks the react-scripts executable in production

## What Was Fixed
✅ Removed node_modules from git tracking  
✅ Updated .gitignore to prevent re-committing node_modules  
✅ Created Render static site configuration (render.yaml)  
✅ Created Vercel deployment configuration (vercel.json)  
✅ Removed production-blocking proxy setting from package.json  
✅ Added Node version lock file (.nvmrc)  
✅ Created backend .gitignore  

## Commands to Run Next

### 1. Clean up git cache and prepare commit
```bash
cd c:\focusmate
git add .
git status
```

### 2. Commit all changes
```bash
git commit -m "Fix deployment: remove node_modules from git, add deployment configs

- Remove node_modules from git tracking
- Update .gitignore for proper exclusions
- Add render.yaml for Render deployment
- Add vercel.json for Vercel deployment
- Remove proxy setting from package.json (use API base URL instead)
- Add .nvmrc for Node 18.17.0 pinning
- Add backend .gitignore"
```

### 3. Push to GitHub
```bash
git push origin main
```

## For Render Deployment

### In Render Dashboard:
1. Go to https://dashboard.render.com
2. Create new Static Site
3. Connect GitHub repo
4. Set **Build Command**: `cd frontend && npm install && npm run build`
5. Set **Publish directory**: `frontend/build`
6. Add environment variable:
   - Key: `NODE_VERSION`
   - Value: `18.17.0`
7. Click Deploy

### In Backend (if needed):
1. Create Web Service for backend
2. Set **Build Command**: `cd backend && npm install`
3. Set **Start Command**: `node server.js`

---

## For Vercel Deployment

### In Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Import GitHub project
3. Framework: **Create React App**
4. Root Directory: `./frontend`
5. Build Command: `npm run build`
6. Output Directory: `build`
7. Click Deploy

---

## Important Production Changes

### API Proxy Setup (Replace proxy in package.json)
Instead of using the proxy setting, update your frontend/src/api.js:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchData = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  return response.json();
};
```

Then add to .env file:
```
REACT_APP_API_URL=https://your-backend-url.com
```

---

## Verification Checklist

- [ ] All node_modules files removed from git
- [ ] .gitignore prevents future commits
- [ ] package-lock.json exists
- [ ] render.yaml or vercel.json configured
- [ ] Build succeeds locally: `cd frontend && npm run build`
- [ ] No .bin executable permission errors

## If Still Getting Permission Errors on Deploy

Run this to ensure .gitignore worked:
```bash
git ls-files | grep node_modules
```

Should return nothing. If it shows files, run:
```bash
git rm --cached -r frontend/node_modules
git commit -m "Remove remaining node_modules from git"
git push
```

---

## Local Testing Before Deploy

```bash
# In frontend directory
npm install
npm run build
npm start
```

The build folder should be created with no errors.
