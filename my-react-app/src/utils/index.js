/**
 * Maps page identifiers to route paths.
 */
const pageRoutes = {
  Dashboard: '/dashboard',
  NewPatient: '/patients/new',
  AIAssistant: '/ai-assistant',
  Reports: '/reports',
  Profile: '/profile',
  Login: '/login',
};

/**
 * Returns the URL path for a given page identifier.
 * Falls back to "/" if the page key is unknown.
 *
 * @param {string} page - The page identifier (e.g., "Dashboard")
 * @returns {string} The corresponding URL path
 */
export function createPageUrl(page) {
  return pageRoutes[page] || '/';
}
