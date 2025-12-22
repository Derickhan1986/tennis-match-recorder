# Tennis Match Recorder PWA

A Progressive Web App for recording and managing tennis matches and training sessions. Built with vanilla JavaScript, IndexedDB for local storage, and GitHub API for cloud synchronization.

## Features

- **Player Management**: Add, edit, and delete players with details (name, handedness, backhand preference, UTR rating)
- **Match Recording**: Record matches with detailed point-by-point scoring
- **Flexible Match Settings**: 
  - Number of sets (1-5)
  - Games per set (1-8)
  - Ad scoring toggle
  - Final set type (Normal Final Set or Super Tie Break)
  - Court type (Grass, Clay, Hard, Carpet)
  - Indoor/Outdoor
  - Tie-break configurations
- **Real-time Scoring**: Live score tracking with automatic game/set/match completion
- **Match History**: View all recorded matches with detailed statistics
- **Data Export/Import**: Backup and restore data as JSON files
- **GitHub Sync**: Automatic cloud backup to GitHub repository
- **Offline Support**: Works without internet connection
- **PWA**: Installable on mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: IndexedDB (local), GitHub API (cloud)
- **Service Worker**: Offline functionality and caching
- **Deployment**: GitHub Pages

## Setup and Deployment

### Prerequisites

- A GitHub account (free)
- A modern web browser
- Git installed on your computer
- (Optional) A local web server for development

### Quick Deploy (Recommended)
### 快速部署（推荐）

**For automatic deployment, see [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**

**Windows users:** Double-click `deploy.bat`  
**Mac/Linux users:** Run `./deploy.sh`

This will automatically:
- Add all files
- Commit changes
- Push to GitHub
- Deploy to GitHub Pages (via GitHub Actions)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right, then "New repository"
3. Name it `tennis-match-recorder` (or any name you prefer)
4. Make it **Public** (required for GitHub Pages free tier)
5. Click "Create repository"

### Step 2: Upload Files to GitHub

#### Option A: Using GitHub Web Interface

1. In your repository, click "uploading an existing file"
2. Upload all files from this project:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `css/styles.css`
   - All files in `js/` folder
3. Click "Commit changes"

#### Option B: Using Git Command Line

```bash
# Clone your repository (replace with your username)
git clone https://github.com/YOUR_USERNAME/tennis-match-recorder.git
cd tennis-match-recorder

# Copy all project files to this directory
# Then commit and push
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "main" branch and "/ (root)" folder
5. Click "Save"
6. Wait a few minutes for GitHub Pages to build
7. Your app will be available at: `https://YOUR_USERNAME.github.io/tennis-match-recorder/`

### Step 4: Create GitHub Personal Access Token (for Sync)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Tennis Match Recorder"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 5: Configure GitHub Sync in App

1. Open your deployed app in a browser
2. Go to "Settings" tab
3. Enter your GitHub token in "GitHub Token" field
4. Enter repository name as: `YOUR_USERNAME/tennis-match-recorder`
5. Click "Sync Now" to test

## Local Development

### Option 1: Python HTTP Server

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

### Option 2: Node.js HTTP Server

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then open: `http://localhost:8000`

### Option 3: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Testing on iPhone

### Method 1: Direct URL

1. Deploy to GitHub Pages (see Step 3 above)
2. Open Safari on iPhone
3. Navigate to your GitHub Pages URL
4. Tap the Share button
5. Select "Add to Home Screen"
6. The app will install as a PWA

### Method 2: Local Network (Development)

1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)
2. Start local server (see Local Development above)
3. On iPhone, connect to same Wi-Fi network
4. Open Safari and go to: `http://YOUR_IP_ADDRESS:8000`
5. Add to Home Screen

## Project Structure

```
tennis-match-recorder/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── app.js             # Main application logic
│   ├── models.js          # Data models
│   ├── storage.js         # IndexedDB storage service
│   ├── match-engine.js    # Tennis scoring logic
│   ├── player-manager.js  # Player management
│   ├── match-recorder.js  # Match recording interface
│   └── github-sync.js     # GitHub API sync
└── README.md              # This file
```

## Usage Guide

### Adding a Player

1. Go to "Players" tab
2. Tap "+" button
3. Fill in player details:
   - Name (required)
   - Handedness: Righty or Lefty
   - Backhand: Single Hand or Double Hand
   - UTR Rating (optional)
4. Tap "Save"

### Recording a Match

1. Go to "Matches" tab
2. Tap "+" button
3. Select player
4. Configure match settings:
   - Number of sets
   - Games per set
   - Ad scoring
   - Final set type
   - Court type
   - Indoor/Outdoor
   - Tie-break settings (if applicable)
5. Tap "Start Match"
6. Record points by tapping "Player Point" or "Opponent Point"
7. Match automatically completes when someone wins required sets

### Viewing Match History

1. Go to "Matches" tab
2. Tap any match to view details
3. See set-by-set scores and match statistics

### Syncing to GitHub

1. Go to "Settings" tab
2. Enter GitHub token and repository name
3. Tap "Sync Now"
4. Data will be backed up to GitHub

### Exporting/Importing Data

1. Go to "Settings" tab
2. Tap "Export Data" to download JSON file
3. Tap "Import Data" to restore from JSON file

## Troubleshooting

### Service Worker Not Working

- Clear browser cache
- Unregister old service worker in browser DevTools
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### GitHub Sync Failing

- Verify token has `repo` scope
- Check repository name format: `username/repo-name`
- Ensure repository exists and is accessible
- Check browser console for error messages

### Data Not Persisting

- Check browser IndexedDB support
- Clear browser storage and try again
- Check browser console for errors

### App Not Installing on iPhone

- Ensure you're using Safari (not Chrome)
- Check that manifest.json is accessible
- Verify HTTPS (required for PWA)
- Try adding to home screen from Safari menu

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Safari (iOS 14.5+, macOS)
- ✅ Firefox (latest)
- ⚠️ Older browsers may have limited support

## Data Storage

- **Local**: IndexedDB (typically several GB available)
- **Cloud**: GitHub repository (1GB per repo limit)
- **Export**: JSON files for manual backup

## Security Notes

- GitHub token is stored locally in IndexedDB
- Never share your GitHub token
- Repository should be private if containing sensitive data
- For public repos, consider not syncing personal data

## Future Enhancements

- [ ] Physical training records
- [ ] Fundamental checks
- [ ] Statistics and analytics
- [ ] Match replay
- [ ] Multi-player support
- [ ] Tournament brackets

## License

This project is for personal use. Feel free to modify and adapt for your needs.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are uploaded correctly
3. Ensure GitHub Pages is enabled
4. Test in different browsers

---

**Note**: This is a personal project. For production use, consider additional security measures and error handling.

