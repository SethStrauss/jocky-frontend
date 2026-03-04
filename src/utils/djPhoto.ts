export function getDJPhoto(): string {
  try {
    return JSON.parse(localStorage.getItem('jocky_dj_profile') || '{}').photo || '';
  } catch {
    return '';
  }
}
