# 🚀 Setup Guide - Split Bill App

Follow these steps to get your Split Bill app running!

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Google/Gmail account (for Firebase)
- [ ] GitHub account (for deployment)

---

## Step 1: Firebase Setup (10 minutes)

### 1.1 Create Firebase Project

1. Go to: https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: `split-bill-app` (or your choice)
4. **Disable Google Analytics** (not needed for this project)
5. Click **"Create project"**
6. Wait for setup to complete

### 1.2 Enable Firestore Database

1. In your project, click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. **Start in test mode** (we'll secure it later)
4. Choose location: **asia-southeast1 (Singapore)** or closest to you
5. Click **"Enable"**
6. Wait for database creation

### 1.3 Get Web App Credentials

1. Go to **Project Settings** (gear icon near "Project Overview")
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>` (Add app)
4. App nickname: `split-bill-web`
5. **Don't** check Firebase Hosting
6. Click **"Register app"**
7. You'll see code like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "split-bill-app-xxxxx.firebaseapp.com",
  projectId: "split-bill-app-xxxxx",
  storageBucket: "split-bill-app-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

8. **Copy these values** - you'll need them next!

---

## Step 2: Local Setup (5 minutes)

### 2.1 Create Environment File

```bash
cd ~/clawd/projects/split-bill-app
cp .env.local.template .env.local
```

### 2.2 Add Firebase Credentials

Edit `.env.local` and paste your Firebase values:

```bash
nano .env.local
```

Fill in from Step 1.3:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=split-bill-app-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=split-bill-app-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=split-bill-app-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`)

### 2.3 Verify Installation

```bash
# Check dependencies are installed
npm list next react firebase

# Should show versions without errors
```

---

## Step 3: Test Locally (2 minutes)

### 3.1 Start Development Server

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

### 3.2 Test in Browser

1. Open: http://localhost:3000
2. You should see the home page with:
   - "💰 Split Bill" title
   - "Create New Session" button
   - "Join Session" button

### 3.3 Quick Test Flow

1. Click **"Create New Session"**
2. Session name: `Test Dinner`
3. Your name: `Dhika`
4. Click **"Create"**
5. You should see:
   - Session header with "Test Dinner"
   - Share code (e.g., `ABC123`)
   - "No receipts yet" message
   - "Add Receipt" button

6. Click **"Add Receipt"**
7. Fill in:
   - Receipt name: `Padang`
   - Tax: `10`
   - Item name: `Nasi Rames`
   - Qty: `2`
   - Price: `16000`
8. Click **"Add Receipt"**

9. You should see the receipt card!
10. Click **"+ Select"** on the item
11. Use slider to select percentage
12. Click **"Confirm"**
13. Click **"📊 View Totals"** at bottom

✅ **If you see your total, everything works!**

---

## Step 4: Test on Mobile (5 minutes)

### Option A: Same WiFi Network

1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Or simpler
   hostname -I
   ```

2. Note the IP (e.g., `192.168.1.100`)

3. On your phone (connected to **same WiFi**):
   - Open browser
   - Go to: `http://192.168.1.100:3000`

4. Test the same flow as Step 3.3

### Option B: Test Multi-User (on same device)

1. Open session on laptop
2. Note the share code (e.g., `ABC123`)
3. Open **incognito/private window**
4. Go to http://localhost:3000
5. Click **"Join Session"**
6. Enter share code: `ABC123`
7. Your name: `Friend`
8. Click **"Join"**
9. Both windows should show 2 people!
10. Selections update in real-time across both windows

---

## Step 5: Deploy to Vercel (10 minutes)

### 5.1 Push to GitHub

```bash
cd ~/clawd/projects/split-bill-app

# Create GitHub repo first at: https://github.com/new
# Name: split-bill-app
# Don't initialize with README

# Then push:
git remote add origin https://github.com/YOUR_USERNAME/split-bill-app.git
git branch -M main
git push -u origin main
```

### 5.2 Deploy on Vercel

1. Go to: https://vercel.com
2. Click **"Sign Up"** (use GitHub account)
3. Click **"Add New..."** → **"Project"**
4. Import `split-bill-app` repository
5. **Don't change any settings yet**
6. Click **"Deploy"**
7. Wait for "Congratulations!" (1-2 minutes)

### 5.3 Add Environment Variables

1. Click **"Go to Dashboard"**
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add each variable from `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` → paste value
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → paste value
   - (repeat for all 6 variables)
5. Click **"Save"**

### 5.4 Redeploy

1. Go to **"Deployments"** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"**
5. Click **"Redeploy"**

### 5.5 Test Live App

1. Once deployed, click **"Visit"**
2. Your app is live at: `https://split-bill-app-xxxxx.vercel.app`
3. Test the same flow as Step 3.3
4. **Share the link with friends!**

---

## Step 6: Secure Firebase (5 minutes)

### 6.1 Update Firestore Rules

1. Go to Firebase Console
2. Click **"Firestore Database"**
3. Click **"Rules"** tab
4. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

5. Click **"Publish"**

**Note:** These are permissive rules for MVP. We'll tighten them later.

---

## ✅ Success Checklist

After completing all steps:

- [ ] Local dev server runs without errors
- [ ] Can create session locally
- [ ] Can add receipt locally
- [ ] Can select items locally
- [ ] Real-time sync works (tested with incognito window)
- [ ] App works on mobile (same WiFi)
- [ ] Deployed to Vercel successfully
- [ ] Live URL works
- [ ] Firebase rules published

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/api-key-not-valid)"
- Check `.env.local` has correct `NEXT_PUBLIC_FIREBASE_API_KEY`
- Make sure variable names start with `NEXT_PUBLIC_`
- Restart dev server after changing `.env.local`

### "Failed to load session"
- Check Firestore is enabled in Firebase Console
- Check Firestore rules allow read/write
- Open browser console (F12) to see errors

### "Can't access on mobile"
- Make sure phone is on **same WiFi**
- Check firewall isn't blocking port 3000
- Try `0.0.0.0:3000` instead of `localhost:3000` when starting dev server:
  ```bash
  npm run dev -- -H 0.0.0.0
  ```

### "Vercel deployment failed"
- Check environment variables are set
- Check all variables start with `NEXT_PUBLIC_`
- Try redeploying from Deployments tab

### "Real-time sync not working"
- Check Firebase Console → Firestore → Data to see if documents are created
- Check browser console for errors
- Try refreshing the page

---

## 📱 Installing as PWA (Phone)

### iOS (Safari)
1. Open the live Vercel URL
2. Tap **Share button** (box with arrow)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **"Add"**
5. App appears on home screen!

### Android (Chrome)
1. Open the live Vercel URL
2. Tap **menu** (3 dots)
3. Tap **"Add to Home Screen"** or **"Install app"**
4. Tap **"Install"**
5. App appears on home screen!

---

## 🎉 Next Steps

Your app is ready to use! Try:

1. **Test with friends:**
   - Share the Vercel URL
   - Split a real bill together
   - Gather feedback

2. **Customize:**
   - Change app name in `app/layout.tsx`
   - Update colors in Tailwind config
   - Add your own branding

3. **Plan Phase 2:**
   - OCR receipt scanning
   - Payment tracking
   - WhatsApp integration

---

**Need help?** Check the main `README.md` or ping me on Discord!

Happy bill splitting! 💰✨
