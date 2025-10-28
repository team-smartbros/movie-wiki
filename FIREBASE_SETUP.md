# Firebase Setup Guide for Movie Wiki

## 🔥 Why Firebase?

Firebase Realtime Database provides:
- ✅ **100% Free Tier** - 1GB storage, 10GB/month bandwidth, 100 simultaneous connections
- ✅ **No Backend Required** - Direct client-side integration
- ✅ **Real-time Updates** - Comments appear instantly for all users
- ✅ **Easy Authentication** - Optional user login (Anonymous, Google, Email)
- ✅ **Security Rules** - Control who can read/write data

## 📋 Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `movie-wiki` (or your choice)
4. Disable Google Analytics (optional, not needed for this app)
5. Click "Create Project"

### Step 2: Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose location (select closest to your users)
4. Start in **Test Mode** (we'll add security rules later)
5. Click "Enable"

### Step 3: Get Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project Settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app name: `Movie Wiki`
6. Copy the `firebaseConfig` object

### Step 4: Add Config to Your Files

Replace the placeholder config in these files:

#### forum.html (line ~259)
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "movie-wiki-xxxxx.firebaseapp.com",
    databaseURL: "https://movie-wiki-xxxxx.firebaseio.com",
    projectId: "movie-wiki-xxxxx",
    storageBucket: "movie-wiki-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

#### details.html (add near the top of script section)
```javascript
const firebaseConfig = {
    // Same config as above
};
```

### Step 5: Database Security Rules

Once everything works, update your security rules:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with these rules:

```json
{
  "rules": {
    "comments": {
      "$movieId": {
        ".read": true,
        ".write": true,
        "$commentId": {
          ".validate": "newData.hasChildren(['userName', 'text', 'timestamp'])"
        }
      }
    },
    "suggestions": {
      ".read": true,
      ".write": true,
      "$suggestionId": {
        ".validate": "newData.hasChildren(['userName', 'title', 'category', 'text', 'timestamp', 'upvotes'])"
      }
    }
  }
}
```

These rules:
- ✅ Allow anyone to read comments and suggestions
- ✅ Allow anyone to write (but validate structure)
- ⚠️ For production, add authentication and rate limiting

### Step 6: Database Structure

Your database will automatically create this structure:

```
movie-wiki-xxxxx
├── comments
│   ├── tt1234567 (IMDb ID)
│   │   ├── -NXXabc123
│   │   │   ├── userName: "John"
│   │   │   ├── text: "Great movie!"
│   │   │   ├── timestamp: 1234567890
│   │   │   └── likes: 5
│   │   └── -NXXdef456
│   │       └── ...
│   └── tt7654321
│       └── ...
└── suggestions
    ├── -NXXghi789
    │   ├── userName: "Alice"
    │   ├── title: "Add dark mode"
    │   ├── category: "feature"
    │   ├── text: "Please add dark mode toggle"
    │   ├── timestamp: 1234567890
    │   └── upvotes: 12
    └── -NXXjkl012
        └── ...
```

## 🎯 Features Enabled

With Firebase configured, you'll have:

### 1. **Comments System** (details.html)
- ✅ Post comments on any movie/TV show
- ✅ Like/unlike comments
- ✅ Real-time updates
- ✅ Sort by newest/popular
- ✅ Display user names and timestamps

### 2. **Community Forum** (forum.html)
- ✅ Submit suggestions/feedback
- ✅ Categorize by type (Feature, Bug, UI/UX, Content, Other)
- ✅ Upvote suggestions
- ✅ Filter by category
- ✅ Sort by recent/popular

## 🔒 Optional: Add Authentication

For better security and user management:

### Enable Anonymous Auth (Easiest)
```javascript
// Enable in Firebase Console → Authentication → Sign-in method → Anonymous
firebase.auth().signInAnonymously();
```

### Enable Google Sign-In
```javascript
// Enable in Firebase Console → Authentication → Sign-in method → Google
const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider);
```

## 📊 Monitor Usage

1. Go to Firebase Console → Usage
2. Check:
   - Database reads/writes
   - Storage used
   - Bandwidth consumed

**Free Tier Limits:**
- 1GB storage
- 10GB/month downloads
- 100 simultaneous connections

## 🚀 Production Checklist

Before deploying:

- [ ] Add proper security rules
- [ ] Enable authentication (optional but recommended)
- [ ] Add rate limiting to prevent spam
- [ ] Add profanity filter for comments
- [ ] Set up database backups
- [ ] Monitor usage to stay within free tier

## 🆘 Troubleshooting

**Comments not appearing?**
- Check Firebase Console → Database → Data tab
- Verify data is being written
- Check browser console for errors
- Ensure firebaseConfig is correct

**"Permission denied" errors?**
- Check Database → Rules
- Ensure test mode is enabled OR rules allow read/write

**Slow loading?**
- Database queries are optimized
- Use pagination for large datasets
- Consider adding indexes (Database → Rules → Indexes)

## 📚 Additional Resources

- [Firebase Docs](https://firebase.google.com/docs/database)
- [Security Rules Guide](https://firebase.google.com/docs/database/security)
- [Best Practices](https://firebase.google.com/docs/database/usage/best-practices)

---

## ✨ Next Steps

After Firebase is configured:

1. Test comments on a movie details page
2. Test forum submissions
3. Share the forum link with users
4. Monitor feedback and implement popular suggestions!

**Need help?** Check the Firebase Console logs or browser console for detailed error messages.
