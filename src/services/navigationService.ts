/**
 * Navigation Service (Simplified)
 *
 * The complex navigation service with priority system and loop detection
 * has been removed since routing is now handled properly by unified route guards.
 *
 * Use React Router's useNavigate() directly or the simplified useNavigation() hook.
 */

// This file is kept for backward compatibility.
// The complex navigation logic has been removed.

console.warn(
  'navigationService is deprecated. Use React Router\'s useNavigate() directly.'
);

export default {};
