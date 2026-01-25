# Deploying PoEC Backend to Railway

This guide covers how to deploy the PoEC v2 Python backend to [Railway](https://railway.app/).

## Prerequisites

- GitHub repository with `backend/` directory
- Railway account

## Configuration Files Created

I have already added the necessary files to `backend/`:
1. **`Procfile`**: Tells Railway how to start the app (`uvicorn app.main:app...`)
2. **`runtime.txt`**: Specifies Python 3.11+
3. **`requirements.txt`**: Includes all dependencies (including `merkletools`)

## Deployment Steps

### Method 1: Deploy from GitHub (Recommended)

1. **Push your code** to GitHub.
   ```bash
   git add .
   git commit -m "Prepare backend for Railway deployment"
   git push origin main
   ```

2. **Open Railway Dashboard**:
   - Click "New Project" -> "Deploy from GitHub repo".
   - Select your repository.

3. **Configure Service**:
   - Railway might detect the root directory. You need to point it to `backend`.
   - Go to **Settings** -> **Root Directory** and set it to `/backend`.
   - Railway will re-build. 

4. **Environment Variables**:
   Go to the **Variables** tab and add:
   ```env
   POEC_ENV=production
   # CRITICAL for free tier: prevents pip form caching large wheels
   PIP_NO_CACHE_DIR=1
   # Optional: limit workers
   WEB_CONCURRENCY=1
   ```
   
   *Note: On the free tier, PyTorch can be heavy. If the build fails due to OOM (Out Of Memory), you might need to increase the plan or use a different installation strategy (see Troubleshooting).*

5. **Expose the Service**:
   - Go to **Settings** -> **Networking**.
   - Click "Generate Domain" to get a public URL (e.g., `poec-production.up.railway.app`).

### Method 2: Railway CLI

1. Install CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link: `railway link` (in the project root)
4. Deploy: `railway up` (make sure to select `backend` as the service root if prompted or configure `railway.toml`)

## Troubleshooting

### "Module not found: merkletools"
Ensure `requirements.txt` was updated and pushed. I just fixed this in the codebase.

### "Slug size too large" or "OOM during build"
PyTorch is large. To fix this on Railway:
1. Create a `railway.json` or `nixpacks.toml` (Railway uses Nixpacks by default) to customize the install.
2. OR, modify `requirements.txt` to install the CPU-only version specifically if Railway supports the flag, but standard `pip` installs might pull the full version.
   
The current `requirements.txt` includes `# Torch CPU Only` comment, but standard `pip install torch` pulls the default wheel. 
If build fails, replace the torch lines in `requirements.txt` with:
```
--extra-index-url https://download.pytorch.org/whl/cpu
torch
torch-geometric
```

## connecting Frontend

Once deployed:
1. Copy your Railway URL (e.g., `https://poec-backend.up.railway.app`).
2. Update your local or Vercel frontend environment variable:
   `NEXT_PUBLIC_API_URL=https://poec-backend.up.railway.app`
