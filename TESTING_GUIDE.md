# 🧪 Complete Testing & Debugging Guide

## ✅ All Fixes Implemented!

### What Was Fixed:

1. ✅ **Genre Filtering** - Now working with `/by_genre/{genre}` API endpoint
2. ✅ **Share Button** - Already implemented, ready to test
3. ✅ **Comments System** - Firebase integrated, needs rules setup
4. ✅ **Firebase Database Rules** - Instructions provided

---

## 🔥 Step 1: Set Up Firebase Database Rules

**CRITICAL: Do this FIRST before testing comments!**

1. Go to: https://console.firebase.google.com
2. Select project: **movie-wiki-86d4d**
3. Click **"Realtime Database"** in left menu
4. Click **"Rules"** tab at the top
5. **Copy and paste these rules:**

```json
{
  "rules": {
    "comments": {
      "$movieId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "suggestions": {
      ".read": true,
      ".write": true
    }
  }
}
```

6. Click **"Publish"** button
7. ✅ **Done!** Comments will now work

---

## 🔐 Step 2: Enable Google Authentication

1. In Firebase Console (same project)
2. Click **"Authentication"** → **"Sign-in method"**
3. Click **"Google"** provider
4. Toggle **"Enable"**
5. Add **Authorized domains**:
   - `localhost`
   - Your production domain (if deploying)
6. Click **"Save"**
7. ✅ **Done!** Login will now work

---

## 🧪 Step 3: Test Everything

### Test 1: Genre Filtering 🎭

```bash
1. Open http://localhost:8000
2. Scroll to "Filter by Genre" section
3. Click "Action" pill
   ✅ Should turn cyan/blue
   ✅ Console shows: "Selected genre: action"
   ✅ Content reloads with action movies
4. Try other genres:
   - Comedy
   - Drama
   - Horror
   - Sci-Fi
   - Thriller
   - Romance
   - Animation
5. Click "All"
   ✅ Should show all content again
```

**Expected Result:**
- Genre pill highlights
- Console logs genre selection
- API fetches genre-specific movies
- All 3 sections (Popular, Latest, Coming Soon) update

**If it doesn't work:**
- Open browser console (F12)
- Check for errors
- Verify API response: https://web-1-production.up.railway.app/by_genre/action

---

### Test 2: Share Button 🔗

```bash
1. Click any movie card
2. Go to movie details page
3. Find floating share button (right side, desktop)
4. Click share button
   
Desktop:
✅ Should show "Link copied to clipboard!" alert
✅ OR show share options (WhatsApp, Twitter, etc.)

Mobile:
✅ Should open native share sheet
✅ Can share via installed apps
```

**Expected Result:**
- Share button is clickable
- On desktop: Copies link to clipboard
- On mobile: Opens native share dialog
- Share URL includes movie details

**If it doesn't work:**
- Check browser console for errors
- Verify Web Share API support (mobile/HTTPS)
- Test clipboard API (should work on localhost)

---

### Test 3: Comments System 💬

**IMPORTANT:** Must complete Step 1 & 2 first!

```bash
1. Open any movie details page
2. Scroll to "Community Comments" section
3. Click "Sign in with Google"
   ✅ Google popup appears
4. Sign in with your Google account
   ✅ Your name appears in nav bar
5. Comment form becomes visible
6. Type a comment (max 500 chars)
7. Click "Post Comment"
   ✅ Comment appears immediately
   ✅ Shows your Google photo
   ✅ Shows "Just now" timestamp
8. Click ❤️ on your comment
   ✅ Like counter increases
   ✅ Heart turns cyan
9. Click ❤️ again
   ✅ Unlike - counter decreases
```

**Expected Result:**
- Login works smoothly
- Comment posts successfully
- Real-time updates
- Like/unlike works
- User photo displays

**If it doesn't work:**

**Error: "Permission Denied"**
→ Check Firebase rules are published (Step 1)
→ Make sure you're signed in

**Error: "User not authenticated"**
→ Check Google Auth is enabled (Step 2)
→ Sign out and sign in again

**Comments don't appear:**
→ Open Firebase Console → Realtime Database → Data
→ Check if comment was written
→ Check browser console for errors

---

### Test 4: Forum Suggestions 💡

```bash
1. Go to Forum page
2. If signed in:
   ✅ Your name is auto-filled
   ✅ Name field is read-only
3. If not signed in:
   ✅ Can type any name
4. Fill out form:
   - Title: "Test suggestion"
   - Category: Feature Request
   - Description: "This is a test"
5. Click "Submit Suggestion"
   ✅ Shows success message
   ✅ Form resets (except name if logged in)
   ✅ Suggestion appears in list below
6. Click upvote arrow (↑)
   ✅ Counter increases
7. Try category filter
   ✅ Shows only selected category
8. Try sort
   ✅ Reorders by recent/popular
```

**Expected Result:**
- Form submission works
- Suggestions appear immediately
- Upvoting works
- Filtering works
- Sorting works

---

## 🐛 Debugging Common Issues:

### Issue: Genre filter doesn't load content

**Check:**
```javascript
// Open browser console
// Should see:
"Selected genre: action"
"Fetching action content from scraper API..."
"Scraper API response for action: {items: [...]}"
```

**Fix:**
- Check API: https://web-1-production.up.railway.app/by_genre/action
- Should return JSON with items array
- If API fails, try: https://web-1-production.up.railway.app/popular

---

### Issue: Share button does nothing

**Check:**
```javascript
// Console should show:
"Share button clicked" // (if logged)
```

**Fix:**
```javascript
// Add this to test:
document.getElementById('shareButton').addEventListener('click', function() {
    console.log('Share clicked!');
    alert('Share button works!');
});
```

---

### Issue: Can't post comments

**Checklist:**
- [ ] Firebase rules published?
- [ ] Google Auth enabled?
- [ ] Signed in with Google?
- [ ] Comment text entered?
- [ ] Browser console shows errors?

**Debug:**
```javascript
// Open console on details page:
console.log('Current user:', currentUser);
// Should show user object if signed in

console.log('Movie ID:', currentMovieId);
// Should show tt1234567 format
```

---

## 📊 Verification Checklist:

### Firebase Setup:
- [ ] Database rules published
- [ ] Google Auth enabled  
- [ ] Authorized domains added
- [ ] Project ID matches (movie-wiki-86d4d)

### Features Working:
- [ ] Genre filter highlights active pill
- [ ] Genre filter loads correct content
- [ ] All 9 genres work
- [ ] Share button is clickable
- [ ] Share copies link or shows dialog
- [ ] Google login works
- [ ] User name shows in nav
- [ ] Comments can be posted
- [ ] Comments appear instantly
- [ ] Like/unlike works
- [ ] Forum suggestions can be submitted
- [ ] Upvoting works

### Browser Console:
- [ ] No red errors
- [ ] API calls succeed
- [ ] Firebase connected
- [ ] Auth state changes logged

---

## 🎯 Quick Test Commands:

**Test Genre API:**
```bash
# In browser console:
fetch('https://web-1-production.up.railway.app/by_genre/action')
  .then(r => r.json())
  .then(d => console.log('Action movies:', d));
```

**Test Firebase Connection:**
```bash
# In browser console (on any page):
console.log('Firebase app:', firebase.app());
console.log('Auth:', firebase.auth().currentUser);
console.log('Database:', firebase.database());
```

**Test Share:**
```bash
# In browser console (on details page):
if (navigator.share) {
  navigator.share({ title: 'Test', url: window.location.href });
} else {
  console.log('Web Share not supported');
}
```

---

## ✅ Success Indicators:

**Genre Filter Working:**
```
Console output:
✅ "Selected genre: action"
✅ "Fetching action content..."
✅ "Detailed items found: [...]"
✅ Cards display on page
```

**Comments Working:**
```
Console output:
✅ "Signed in: Your Name"
✅ "Loading comments..."
✅ Comment count updates
✅ Like count changes
```

**Share Working:**
```
User sees:
✅ Alert: "Link copied!"
✅ OR native share sheet opens
✅ Link can be pasted elsewhere
```

---

## 🆘 Still Not Working?

1. **Clear browser cache:** Ctrl+Shift+Delete
2. **Hard refresh:** Ctrl+Shift+R
3. **Try incognito mode**
4. **Check Firebase Console:**
   - Usage tab (check quotas)
   - Database tab (see data)
   - Authentication tab (see users)
5. **Check browser console** for specific errors
6. **Test API directly** in browser

---

## 📞 Support Info:

**API Endpoints:**
- Genre: `https://web-1-production.up.railway.app/by_genre/{genre}`
- Popular: `https://web-1-production.up.railway.app/popular`
- Upcoming: `https://web-1-production.up.railway.app/upcoming`

**Firebase:**
- Project: movie-wiki-86d4d
- Database: Realtime Database
- Auth: Google Sign-In

**Supported Genres:**
- action, comedy, drama, horror, sci_fi (API uses underscore), thriller, romance, animation

---

**🎉 Once all tests pass, your Movie Wiki is fully functional!**
