# CampusConnect — Web Prototype

A responsive, student-first campus utility prototype using the CampusConnect warm ivory / burgundy / antique-gold theme.

## Included features
- Responsive landing page with app preview
- Category navigation: Books, Food, Study, Events, Opportunities, Essentials
- Search and category filters
- Sample listings served by a small Node.js backend
- Save/unsave listings for the current browser session
- Add-listing modal connected to a POST API
- Supplier promotion CTA
- Privacy, sponsored-content, and authorized-learning-resource reminders

## Requirements
- Node.js 18 or newer
- No third-party server packages required

## Run locally
1. Extract the ZIP.
2. Open a terminal in the extracted `campusconnect_web` folder.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## API
- `GET /api/health` — health check
- `GET /api/listings?category=Books&q=math` — search and filter listings
- `GET /api/listings/:id` — fetch one listing
- `POST /api/listings` — add a listing

Example POST body:
```json
{
  "title": "Second-hand physics textbook",
  "category": "Books",
  "detail": "Good condition, semester 2",
  "price": 180,
  "seller": "Student seller"
}
```

## Prototype limitations
- Listings are stored in server memory and reset when the server restarts.
- Saved items are held in browser memory and reset on page reload.
- There is no authentication, production database, payment system, live messaging, or verified seller process.
- Sample listings are illustrative, not real offers. The app is a prototype and should not be used to publish personal information.
- Before a public launch, add authentication, persistent storage, server-side validation/rate limits, moderation, privacy controls, and appropriate security review.


## Update
The static-file handler sends HTML/CSS/JS as their original bytes with the appropriate content type. If you previously ran the broken version, stop the server with `Ctrl+C`, replace the extracted files with this ZIP, then run `npm start` again.
