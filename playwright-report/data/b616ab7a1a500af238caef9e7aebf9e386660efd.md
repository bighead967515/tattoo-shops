# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> Launch Journey Smoke >> public request board journey renders list shell
- Location: tests\e2e\journeys.spec.ts:26:3

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - link "Ink Connect Ink Connect" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Ink Connect" [ref=e7]
        - generic [ref=e8]: Ink Connect
      - link "Sign Up Free" [ref=e10] [cursor=pointer]:
        - /url: /login?mode=signup
        - button "Sign Up Free" [ref=e11]:
          - img
          - text: Sign Up Free
      - navigation [ref=e12]:
        - link "Browse Artists" [ref=e13] [cursor=pointer]:
          - /url: /artists
          - img [ref=e14]
          - text: Browse Artists
        - link "How It Works" [ref=e19] [cursor=pointer]:
          - /url: /#how-it-works
          - img [ref=e20]
          - text: How It Works
        - link "For Artists" [ref=e23] [cursor=pointer]:
          - /url: /for-artists
          - img [ref=e24]
          - text: For Artists
        - link "Sign In" [ref=e30] [cursor=pointer]:
          - /url: /login
          - img [ref=e31]
          - text: Sign In
      - generic [ref=e34]:
        - button "Settings & Account" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
          - generic [ref=e39]: Settings & Account
          - img [ref=e40]
        - generic [ref=e42]:
          - button "Light Mode" [ref=e43] [cursor=pointer]:
            - img [ref=e44]
            - text: Light Mode
          - link "Help" [ref=e50] [cursor=pointer]:
            - /url: /help
            - img [ref=e51]
            - text: Help
          - link "Sign Up Free" [ref=e54] [cursor=pointer]:
            - /url: /login?mode=signup
            - img [ref=e55]
            - text: Sign Up Free
  - main [ref=e58]:
    - generic [ref=e59]:
      - generic [ref=e60]:
        - generic [ref=e61]:
          - heading "Tattoo Request Board" [level=1] [ref=e62]
          - paragraph [ref=e63]: Browse tattoo requests from clients looking for artists
        - link "Sign in to post a request" [ref=e64] [cursor=pointer]:
          - /url: /login
          - button "Sign in to post a request" [ref=e65]
      - generic [ref=e68]:
        - generic [ref=e69]:
          - img [ref=e70]
          - textbox "Search requests" [ref=e73]:
            - /placeholder: Search requests...
        - combobox [ref=e74] [cursor=pointer]:
          - img
          - generic: All Styles
          - img
```