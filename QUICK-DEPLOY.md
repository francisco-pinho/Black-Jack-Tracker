# 🚀 Quick Deploy Instructions

## GitHub Pages (Recommended)

**Step 1: Create GitHub Repository**

1. Go to [github.com](https://github.com) and create new repository
2. Name it: `blackjack-score-tracker`
3. Make it **Public**
4. Don't add README (we have one)

**Step 2: Push Code**

```bash
cd c:\Users\franc\.vscode\Black-Jack-Tracker
git add .
git commit -m "Deploy Blackjack Score Tracker"
git remote add origin https://github.com/YOURUSERNAME/blackjack-score-tracker.git
git push -u origin main
```

**Step 3: Enable GitHub Pages**

1. Go to your repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Click **Save**

**Step 4: Access Your Site**
Wait 5 minutes, then visit:
`https://YOURUSERNAME.github.io/blackjack-score-tracker/blackjack-score-tracker/src/`

---

## Alternative: Netlify (Super Easy)

1. Go to [netlify.com](https://netlify.com)
2. Drag the `blackjack-score-tracker/src` folder
3. Get instant URL!

---

## Files Created for Deployment

✅ `package.json` - Project configuration  
✅ `.github/workflows/deploy.yml` - Auto-deployment  
✅ `netlify.toml` - Netlify configuration  
✅ `vercel.json` - Vercel configuration  
✅ `.gitignore` - Git ignore rules  
✅ `LICENSE` - MIT License  
✅ `DEPLOYMENT.md` - Detailed instructions  
✅ `404.html` - Custom error page  
✅ Enhanced `index.html` - SEO optimized  

**Your Blackjack Score Tracker is ready for deployment! 🎉**
