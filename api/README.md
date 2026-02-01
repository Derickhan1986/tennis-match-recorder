# Match Review API (Vercel serverless)

This folder contains the backend proxy for the **Match Review** feature. It forwards match data to Deepseek and returns the AI-generated review.

## Deployment (Vercel)

1. Push this repo to GitHub and connect it to [Vercel](https://vercel.com).
2. In the Vercel project **Settings → Environment Variables**, add:
   - **Name:** `DEEPSEEK_API_KEY`
   - **Value:** your Deepseek API key (from [platform.deepseek.com](https://platform.deepseek.com))
3. Deploy. Your API will be at `https://<your-project>.vercel.app/api/match-review`.

## Frontend configuration

After deployment, set the proxy URL in [js/app.js](js/app.js):

```js
const MATCH_REVIEW_API_URL = 'https://<your-project>.vercel.app/api/match-review';
```

Replace `<your-project>` with your Vercel project name or custom domain.

## Request format

- **Method:** POST  
- **Body:** `{ "systemPrompt": "...", "userMessage": "..." }`  
- **Response (200):** `{ "review": "..." }`  
- **Response (error):** `{ "error": "..." }`
