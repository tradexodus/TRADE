# Supabase URL Configuration Guide

## Authentication URLs Configuration

To properly configure Google OAuth and other authentication providers in Supabase, you need to set up the following URLs in your Supabase project settings:

### 1. Site URL Configuration

In your Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Set the **Site URL** to:
   ```
   https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app
   ```

### 2. Redirect URLs Configuration

Add the following URLs to the **Redirect URLs** list:

```
https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app/dashboard
https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app/auth/callback
https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app
```

### 3. Google Cloud Console Configuration

For Google OAuth to work properly, configure these **Authorized redirect URIs** in your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:

```
https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app/dashboard
```

**Note**: Replace `[YOUR_SUPABASE_PROJECT_REF]` with your actual Supabase project reference ID.

### 4. Additional Security Settings

#### Email Confirmation
- **Confirm email**: Enable if you want users to verify their email
- **Email confirmation redirect**: `https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app/dashboard`

#### Password Reset
- **Password reset redirect**: `https://unruffled-dewdney9-t9g3a.view-3.tempo-dev.app/reset-password`

### 5. Environment Variables

Ensure these environment variables are properly set:

```env
VITE_SUPABASE_URL=https://[YOUR_SUPABASE_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_PROJECT_ID=[YOUR_PROJECT_ID]
SUPABASE_URL=https://[YOUR_SUPABASE_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
```

### 6. Testing the Configuration

After configuring the URLs:

1. Test Google sign-in from the login page
2. Test Google sign-up from the signup page
3. Verify that users are redirected to the dashboard after successful authentication
4. Check that the URL remains on your deployed domain throughout the process

### Troubleshooting

**Issue**: Redirecting to localhost instead of deployed URL
- **Solution**: Ensure the Site URL and Redirect URLs are correctly set in Supabase Dashboard
- **Check**: Verify Google Cloud Console has the correct authorized redirect URIs

**Issue**: "redirect_uri_mismatch" error
- **Solution**: Make sure the redirect URI in Google Cloud Console matches exactly with Supabase callback URL

**Issue**: Authentication works locally but not in production
- **Solution**: Double-check that all URLs use the production domain, not localhost

---

## Quick Checklist

- [ ] Site URL set in Supabase Dashboard
- [ ] Redirect URLs added in Supabase Dashboard
- [ ] Google Cloud Console redirect URIs configured
- [ ] Environment variables properly set
- [ ] Test Google OAuth flow
- [ ] Verify redirect to dashboard works
