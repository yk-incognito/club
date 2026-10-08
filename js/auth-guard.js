import { supabase } from './supabase-client.js';

/**
 * Validates current session and enforces role-based route security
 * @param {Array<string>} allowedRoles - Optional list of roles permitted to view the page
 */
export async function enforceAuth(allowedRoles = []) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    window.location.replace('login.html');
    return null;
  }

  // Fetch verified profile directly from Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, reg_no, official_name, nickname, role, status, lockout_until')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    window.location.replace('login.html');
    return null;
  }

  // Prevent suspended or pending users from accessing authenticated portals
  if (profile.status === 'pending') {
    alert('Your membership application is currently pending approval by club executives.');
    await supabase.auth.signOut();
    window.location.replace('login.html');
    return null;
  }

  if (profile.status === 'inactive' || profile.status === 'suspended') {
    alert('Your account is currently inactive. Contact the club secretary.');
    await supabase.auth.signOut();
    window.location.replace('login.html');
    return null;
  }

  // Enforce specific role authorization if defined
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    alert('Access Restricted: You do not possess the necessary executive permissions.');
    window.location.replace('dashboard.html');
    return null;
  }

  return profile;
}

export async function logoutUser() {
  await supabase.auth.signOut();
  window.location.replace('login.html');
}
