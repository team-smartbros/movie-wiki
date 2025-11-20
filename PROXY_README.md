# Local Proxy Server for Movie Wiki

This local proxy server can help bypass CORS restrictions when playing IMDb trailer videos.

## Setup Instructions

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/
   - Install the LTS version

2. **Install dependencies**:
   ```bash
   cd "c:\Users\USER\Desktop\Nimit\Nimit Coding Workspace\The Movie Wiki"
   npm install
   ```

3. **Start the proxy server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **The proxy will be available at**:
   - http://localhost:3001

## How It Works

The proxy server works by:
1. Removing cookies and tracking headers from requests
2. Setting appropriate User-Agent and Referer headers
3. Acting as an intermediary between your browser and IMDb's video servers

## Usage

Once the proxy server is running, the Movie Wiki application will automatically detect it and use it as the first option for video playback.

## Troubleshooting

If you're still having issues:

1. Make sure the proxy server is running (check console for "Proxy server listening")
2. Check that port 3001 is not blocked by firewall
3. Try refreshing the Movie Wiki page
4. Check the browser console for any error messages

## Security Note

This proxy is intended for local development use only. Do not deploy it to a public server without proper security measures.