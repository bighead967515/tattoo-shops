---
name: "Weekly SEO Blog Writer"
description: "Scheduled weekly workflow that uses Gemini to write high-quality tattoo articles, formats them as JSON, and publishes them securely to the website backend for SEO indexing."
tags: ["ai", "blog", "gemini", "scheduler"]
---

# Weekly SEO Blog Writer Workflow

## Overview

To keep the platform's content fresh and rank high on search engines (which feeds downstream AI crawlers like ChatGPT, Claude, and Perplexity), this workflow triggers automatically every week to:

1. **Trigger**: Executes every Monday at 9:00 AM.
2. **AI Generation**: Prompts Gemini 1.5 Pro to write an SEO-optimized blog post of at least 600 words on tattoo trends, aftercare, styles, or placement.
3. **Format Parsing**: Formats the output as a clean JSON object containing title, slug, summary, and content.
4. **Publish HTTP Request**: Sends a secure POST request to the Express API backend at `/api/blog/posts` with `Authorization: Bearer <N8N_BLOG_SECRET>` to store it in the database and list it in `sitemap.xml`.

## Trigger

**Type**: Schedule Trigger  
**Interval**: Weekly (Mondays at 09:00)

## Required Environment Variables

```
N8N_BLOG_SECRET  — Shared secret matching the value in the backend .env
BACKEND_URL      — Base URL of the backend server (defaults to http://localhost:3000)
```

## Workflow Steps

### 1. Schedule Trigger
```
node_name: Schedule Trigger
type: Schedule Trigger
rule: weekly (Mondays at 09:00)
```

### 2. Draft Blog Post via Gemini
```
node_name: Draft Blog Post via Gemini
type: Gemini Chat Node
model: google/gemini-1.5-pro
temperature: 0.7
```
**Prompt**:
> Write a high-quality, engaging, and SEO-optimized blog post for our tattoo directory & booking platform, Ink Connect.
> Respond ONLY with a valid JSON object matching this schema. Do not wrap the JSON in markdown code blocks or add any other text:
> `{ "title": "...", "slug": "...", "summary": "...", "content": "..." }`

### 3. Parse & Format JSON
```
node_name: Parse & Format JSON
type: Code
language: JavaScript
```
**Logic**: Sanitizes potential markdown wrappers and parses the output string to actual JSON object. Includes a robust fallback post if parsing fails.

### 4. Publish Post to Platform API
```
node_name: Publish Post to Platform API
type: HTTP Request
method: POST
url: {{BACKEND_URL}}/api/blog/posts
headers:
  Authorization: Bearer {{N8N_BLOG_SECRET}}
body: JSON containing title, slug, summary, and content
```

## Backend Integration

On the backend, the post is saved to the `blog_posts` table via:
- [POST] `/api/blog/posts` - protected by `N8N_BLOG_SECRET`
- [GET] `/api/blog/posts` - public listing of posts
- [GET] `/api/blog/posts/:slug` - public single post fetching
- [GET] `/sitemap.xml` - updated to dynamically query published posts and append their sitemap XML nodes.
