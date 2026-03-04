export function loadVenueName(): string {
  try {
    const s = localStorage.getItem('jocky_venue_profile');
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.companyName) return parsed.companyName;
    }
  } catch {}
  return 'My Venue';
}
