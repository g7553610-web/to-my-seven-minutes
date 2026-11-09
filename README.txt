TO MY 7 MINUTES - WEBSITE FILES

FILES
- index.html: website structure
- style.css: design and layout
- script.js: login, upload, gallery, delete, and Supabase connection
- setup.sql: creates the database table and private access rules

BEFORE RUNNING THE WEBSITE

1. In Supabase, open Project Settings -> API (or API Keys).
2. Copy the Project URL.
3. Copy the Publishable key (it may start with sb_publishable_).
   Never put a secret key or service_role key in website code.
4. Open script.js and replace:
   PASTE_YOUR_SUPABASE_PROJECT_URL_HERE
   PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE
   with your own values. Keep the quotation marks.

5. In Supabase, open SQL Editor -> New query.
6. Open setup.sql, copy all its contents, paste into the SQL Editor, and click Run.
7. In Authentication -> URL Configuration, add your website's local/deployed URL to the allowed redirect URLs if Supabase asks.
8. In Authentication -> Providers -> Email, keep Email enabled.
9. For a simple shared scrapbook, create ONE account and use the same email/password on both devices.
   Do not send the password to anyone else. Use a unique password.
10. Open index.html with a local server (recommended: VS Code Live Server) or deploy the folder to a static host.

STORAGE NOTES
- Bucket name must be exactly: LOVESTORY
- Keep the bucket PRIVATE.
- The upload code stores images inside: private/<user-id>/<random-file-name>
- Your existing Storage policies should permit authenticated access to objects in the "private" folder.
- The SQL creates database access rules so each signed-in account can read, add, and delete its own memory records.

IMPORTANT
- If you and your boyfriend use different accounts, this starter version will not share each other's records. Use the same shared account on both devices for now.
- If email confirmation is enabled, confirm the signup email before logging in.
- This starter version is a basic private scrapbook, not a fully audited security system.
- Never share your Supabase secret/service_role key.
- Supabase free projects may have usage limits and can pause due to inactivity. Check your plan and current limits.
