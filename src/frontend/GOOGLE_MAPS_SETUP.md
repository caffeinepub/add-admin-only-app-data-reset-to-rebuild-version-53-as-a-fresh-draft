# Google Maps API Configuration Guide

This application uses Google Maps to display property locations and provide interactive mapping features. Follow these steps to configure the Google Maps API key.

## Prerequisites

- A Google Cloud Platform account
- **Billing enabled on your Google Cloud project (REQUIRED - even for free tier)**

## Step-by-Step Setup Guide

### Step 1: Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the generated API key (typically 39 characters, alphanumeric with dashes/underscores)

### Step 2: Enable Required APIs (CRITICAL)

**⚠️ You must enable these APIs before the map will work:**

1. **Maps JavaScript API** - For displaying interactive maps
2. **Places API** - For location search and autocomplete
3. **Geocoding API** - For converting addresses to coordinates

To enable these APIs:
1. Go to **APIs & Services** → **Library**
2. Search for each API listed above
3. Click on the API name
4. Click the **Enable** button
5. Wait for the API to be enabled (usually takes a few seconds)
6. **Verify** each API shows as "Enabled" in your dashboard

**The application will automatically detect if these APIs are not enabled and provide specific error messages.**

### Step 3: Enable Billing (MANDATORY - NOT OPTIONAL)

**⚠️ CRITICAL: Google Maps Platform requires billing to be enabled, even if you stay within the free tier.**

Without billing enabled, you will see errors like:
- "This page didn't load Google Maps correctly"
- "Google Maps authentication failed"
- "RefererNotAllowedMapError"
- "ApiNotActivatedMapError"

**To Enable Billing:**

1. Go to **Billing** in the Google Cloud Console
2. Click **Link a billing account** or **Create billing account**
3. Add a payment method (credit card required)
4. Link the billing account to your project
5. **Verify** billing is active in your project settings
6. Wait a few minutes for billing to activate

**Free Tier Benefits:**
- Google provides **$200 free credit** every month
- Most small to medium applications stay within the free tier
- You can set up billing alerts to monitor usage
- The free credit covers approximately:
  - 28,000 map loads per month
  - 40,000 geocoding requests per month
  - 17,000 place searches per month

### Step 4: Configure API Key Restrictions (Recommended for Security)

For security, restrict your API key:

1. In the **Credentials** page, click on your API key
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add your development and production URLs:
   - `http://localhost:3000/*` (for local development)
   - `http://localhost:*/*` (for other local ports)
   - `https://yourdomain.com/*` (for production - add when deploying)
4. Under **API restrictions**, select **Restrict key**
5. Select only the three APIs mentioned above:
   - Maps JavaScript API
   - Places API
   - Geocoding API
6. Click **Save**

**Note:** The application will automatically detect domain restriction issues and provide guidance.

### Step 5: Configure the Application

#### For Development:

1. Navigate to the `frontend` directory of your project

2. Create a `.env` file (copy from `.env.example` if it exists):
   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file and add your API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
   Replace `your_actual_api_key_here` with the API key you copied in Step 1.

4. Save the file

5. Restart the development server:
   ```bash
   npm run start
   ```

#### For Production:

1. Ensure your production environment has the `.env` file configured with the correct API key
2. Verify the environment variable `VITE_GOOGLE_MAPS_API_KEY` is properly set
3. Add your production domain to the API key restrictions in Google Cloud Console
4. Test the map loading in your production environment

**The application will automatically validate your API key format and provide specific error messages if there are issues.**

### Step 6: Validation Check

After completing the setup, verify your configuration:

1. Open the application in your browser
2. Navigate to a page with a map
3. The map should load without errors
4. Check browser console (F12) for any warnings or errors
5. Test the following features:
   - Map displays correctly
   - Location search works
   - Markers appear on the map
   - Clicking markers shows property information

**The application includes automatic validation and will:**
- Check if the API key is properly formatted
- Verify the API key is not using placeholder values
- Detect if required APIs are enabled
- Automatically retry loading if initial attempt fails (up to 3 retries with exponential backoff)
- Provide specific error messages for different failure scenarios
- Handle ApiNotActivatedMapError and RefererNotAllowedMapError with specific fallback guidance

## Troubleshooting

### Error: "This page didn't load Google Maps correctly"

This is the most common error and typically means one of the following:

**1. Billing Not Enabled (Most Common - 80% of cases):**
- **Solution:** Enable billing in Google Cloud Console (see Step 3)
- This is the #1 cause of this error
- Billing is mandatory even for free tier usage
- Without billing, the map will NOT load

**2. API Key Issues:**
- The API key is missing or incorrect
- The API key has the wrong restrictions
- The API key is not activated for web use

**Solution:**
- Verify the API key in your `.env` file matches the one in Google Cloud Console
- Check that HTTP referrer restrictions include `http://localhost:3000/*`
- Ensure the API key is not restricted to specific IP addresses
- The application will automatically validate the API key format

**3. Required APIs Not Enabled:**
- Maps JavaScript API is not enabled
- Places API is not enabled
- Geocoding API is not enabled

**Solution:**
- Go to **APIs & Services** → **Library** in Google Cloud Console
- Search for and enable each required API
- Wait a few minutes for changes to propagate
- Verify each API shows as "Enabled"
- The application will detect this and provide specific error messages

### Error: "Google Maps authentication failed"

**Causes:**
- Invalid API key
- API key restrictions blocking your domain
- API key not activated
- Billing not enabled

**Solution:**
1. Double-check the API key in your `.env` file
2. Verify the key is correct in Google Cloud Console
3. Check API key restrictions allow your domain
4. **Verify billing is enabled**
5. Try creating a new API key without restrictions for testing
6. The application will provide specific guidance based on the error type

### Error: "RefererNotAllowedMapError"

**Cause:**
- API key has HTTP referrer restrictions that don't include your domain

**Solution:**
1. Go to **Credentials** in Google Cloud Console
2. Edit your API key
3. Under **Application restrictions**, add your domain
4. For local development, add: `http://localhost:3000/*` and `http://localhost:*/*`
5. For production, add your production domain
6. The application will automatically detect this error and provide specific instructions

### Error: "ApiNotActivatedMapError"

**Cause:**
- Required APIs (Maps JavaScript API, Places API, Geocoding API) are not enabled

**Solution:**
1. Go to **APIs & Services** → **Library**
2. Enable Maps JavaScript API
3. Enable Places API
4. Enable Geocoding API
5. Wait a few minutes for changes to propagate
6. The application will detect this and provide specific error messages with direct links

### Map Not Loading or Blank Screen

**Causes:**
- Network connectivity issues
- Browser blocking Google Maps
- JavaScript errors in console
- Billing not enabled

**Solution:**
1. Check your internet connection
2. Open browser console (F12) and look for error messages
3. Disable ad blockers or privacy extensions temporarily
4. Clear browser cache and cookies
5. Try a different browser
6. **Verify billing is enabled in Google Cloud Console**
7. The application includes automatic retry logic (up to 3 attempts with exponential backoff)

### Error: "OVER_QUERY_LIMIT"

**Causes:**
- Exceeded free tier quota
- Billing not enabled

**Solution:**
1. Enable billing in Google Cloud Console
2. Check your usage in **APIs & Services** → **Dashboard**
3. Set up billing alerts to monitor usage

## Automatic Error Detection & Recovery

The application includes intelligent error handling:

1. **API Key Validation:**
   - Checks if API key is missing or using placeholder values
   - Validates API key format (length, characters)
   - Provides specific error messages for invalid keys
   - Supports production mode API key validation

2. **Automatic Retry Mechanism:**
   - Attempts to load Google Maps up to 3 times
   - Uses exponential backoff (1s, 2s, 4s delays)
   - Shows retry progress to users
   - Re-attempts initialization with exponential backoff on failure

3. **Specific Error Detection:**
   - Detects billing issues
   - Identifies missing or disabled APIs
   - Recognizes domain restriction problems
   - Handles ApiNotActivatedMapError with specific guidance
   - Handles RefererNotAllowedMapError with specific guidance
   - Provides targeted solutions for each error type

4. **User Feedback:**
   - Shows loading states with retry count
   - Displays detailed error messages with solutions
   - Provides links to Google Cloud Console
   - Offers step-by-step troubleshooting guides

## Environment Variables

The application uses Vite's environment variable system:

- All environment variables must be prefixed with `VITE_` to be exposed to the client
- Variables must be defined in the `.env` file in the `frontend` directory
- Access variables using `import.meta.env.VITE_VARIABLE_NAME`
- Restart the development server after changing `.env`
- For production, ensure environment variables are properly configured

## Security Best Practices

1. **Never commit your `.env` file** to version control
   - The `.env` file is already in `.gitignore`
   - Use `.env.example` as a template

2. **Use different API keys for development and production**
   - Create separate projects in Google Cloud Console
   - Use environment-specific restrictions

3. **Implement API key restrictions**
   - Use HTTP referrer restrictions for web applications
   - Restrict to only the APIs you need
   - Monitor usage regularly

4. **Set up billing alerts**
   - Go to **Billing** → **Budgets & alerts**
   - Create alerts at different thresholds (e.g., 50%, 90%, 100%)
   - Receive email notifications when limits are reached

## Cost Management

Google Maps Platform offers generous free tier:

- **$200 monthly credit** (covers ~28,000 map loads)
- **Dynamic Maps**: $7 per 1,000 loads (after free credit)
- **Places API**: $17 per 1,000 requests (after free credit)
- **Geocoding API**: $5 per 1,000 requests (after free credit)

To avoid unexpected charges:

1. **Set up billing alerts** in Google Cloud Console
2. **Monitor your API usage** regularly in the Dashboard
3. **Implement usage quotas** if needed
4. **Use API key restrictions** to prevent unauthorized use
5. **Optimize API calls** in your application

## Testing Your Configuration

After completing the setup:

1. Restart your development server
2. Navigate to a page with a map
3. The map should load without errors
4. Check browser console (F12) for any warnings or errors
5. Test the following features:
   - Map displays correctly
   - Location search works
   - Markers appear on the map
   - Clicking markers shows property information
6. Verify no authentication errors appear

**The application will automatically:**
- Validate your API key
- Check if required APIs are enabled
- Retry loading if initial attempt fails
- Provide specific error messages and solutions
- Handle common errors like ApiNotActivatedMapError and RefererNotAllowedMapError

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Information](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Usage Limits](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Billing Setup Guide](https://cloud.google.com/billing/docs/how-to/modify-project)

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify all steps in this guide have been completed
3. **Ensure billing is enabled** (most common issue)
4. Review the [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
5. Check the [Google Maps Platform issue tracker](https://issuetracker.google.com/issues?q=componentid:188841)

**The application provides detailed error messages and troubleshooting guidance for common issues.**

## Summary Checklist

- [ ] Created Google Cloud project
- [ ] Generated API key (39 characters, alphanumeric)
- [ ] Enabled Maps JavaScript API
- [ ] Enabled Places API
- [ ] Enabled Geocoding API
- [ ] **Enabled billing on the project (MANDATORY)**
- [ ] Verified billing is active
- [ ] Configured API key restrictions (HTTP referrers)
- [ ] Added localhost domains to restrictions
- [ ] Added production domain to restrictions (if deploying)
- [ ] Created `.env` file in `frontend` directory
- [ ] Added API key to `.env` file (VITE_GOOGLE_MAPS_API_KEY)
- [ ] Restarted development server
- [ ] Verified map loads correctly
- [ ] Tested location search functionality
- [ ] Set up billing alerts
- [ ] Tested all map features
- [ ] Verified production environment configuration (if deploying)

**⚠️ IMPORTANT: If the map doesn't load, the most common cause is billing not being enabled. Double-check Step 3!**

**The application includes automatic validation and will guide you through troubleshooting if there are any issues.**

Once all items are checked, your Google Maps integration should be working correctly!
