# Blackjack

This project is already a website: it is a static web app made from `index.html`, `styles.css`, and `script.js`.

## Run locally

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open `http://localhost:8000/index.html`.

## Publish as a website

Good static hosting options:

- GitHub Pages
- Netlify
- Vercel

Because this app is fully static, deployment is just uploading the files in this folder.

## iOS app

An iOS wrapper starter lives in `ios/BlackjackIOS/`. It uses SwiftUI plus `WKWebView` to load either:

- a hosted website URL, or
- the bundled local web files inside the app

## Shared flow

1. Finish and publish the website.
2. Point the iOS app at the hosted site for easiest updates.
3. If you want offline play later, bundle the web assets into the app target.
