// This function extracts the subdomain from the window's hostname.
// e.g., 'sweet-anny.precivox.com' -> 'sweet-anny'
export const getSubdomain = (hostname) => {
  const parts = hostname.split('.');
  
  // For local development (e.g., localhost:5173), return a default for testing.
  // IMPORTANT: Replace 'sweetland-anny' with a valid subdomain from your database.
  if (hostname.includes('localhost') || parts.length < 3) {
    return 'sweetland-anny'; 
  }

  // For production (e.g., store.domain.com)
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  // Return null if no valid subdomain is found
  return null;
};