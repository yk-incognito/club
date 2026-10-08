import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  loadPublicFeed();
  loadClubAchievements();
});

/**
 * Fetches approved public announcements and activity cards
 */
async function loadPublicFeed() {
  const feedContainer = document.getElementById('activity-feed-grid');
  if (!feedContainer) return;

  try {
    const { data: posts, error } = await supabase
      .from('public_feed')
      .select('id, title, description, media_url, created_at, profiles(nickname)')
      .order('created_at', { ascending: false })
      .limit(9);

    if (error) throw error;

    if (!posts || posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-feed-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--color-white); border-radius: var(--radius-lg);">
          <p style="color: var(--color-muted); font-size: 1.1rem;">No recent activities published yet. Stay tuned!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = posts.map(post => {
      const formattedDate = new Date(post.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return `
        <article class="feed-card">
          <div class="feed-image-slot">
            <img src="${post.media_url}" alt="${post.title}" loading="lazy">
          </div>
          <div class="feed-card-body">
            <span class="badge badge-active">Club Event</span>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description || '')}</p>
            <div class="feed-meta">
              <span>By ${post.profiles?.nickname || 'Executive Desk'}</span>
              <time datetime="${post.created_at}">${formattedDate}</time>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching public feed:', err.message);
  }
}

/**
 * Loads Club Hall of Fame / Past Office Bearers
 */
async function loadClubAchievements() {
  const hallContainer = document.getElementById('hall-of-fame-grid');
  if (!hallContainer) return;

  // Placeholder data for club founders and sports tournament wins
  const achievements = [
    { title: 'Sub-District Sevens Trophy', year: '2025', desc: 'Champions - Undefeated run at the local turf tournament.' },
    { title: 'Community Reading Hall Launch', year: '2024', desc: 'Inaugurated club library and daily newspaper reading circle.' }
  ];

  hallContainer.innerHTML = achievements.map(item => `
    <div class="achievement-card" style="background: var(--color-white); padding: 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
      <span class="badge badge-pending">${item.year}</span>
      <h4 style="margin: 0.5rem 0; color: var(--color-primary);">${item.title}</h4>
      <p style="color: var(--color-muted); font-size: 0.9rem;">${item.desc}</p>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
