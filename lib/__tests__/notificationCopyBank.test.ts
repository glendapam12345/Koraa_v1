import {
  pickNotificationCopySync,
  resolveNotifPatternTags,
} from '@/lib/notificationCopyBank';

describe('notificationCopyBank', () => {
  it('prioritizes pattern tags from context', () => {
    const tags = resolveNotifPatternTags({
      firstName: 'Pam',
      avgEnergy: 2,
      lastEmotion: 'abrumada',
      daysSinceCheckIn: 3,
    });
    expect(tags[0]).toBe('named');
    expect(tags).toContain('low_energy');
    expect(tags).toContain('overwhelmed');
    expect(tags).toContain('missed');
    expect(tags[tags.length - 1]).toBe('default');
  });

  it('rotates copy with different salts', () => {
    const ids = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map(
        (salt) => pickNotificationCopySync('es', 'daily', { firstName: 'Pam', salt }).id,
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
    const named = pickNotificationCopySync('es', 'daily', { firstName: 'Pam', salt: 0 });
    // named pool or default may include name
    expect(named.title + named.body).toMatch(/Pam|Ellie/);
  });

  it('avoids repeating last id when possible', () => {
    const first = pickNotificationCopySync('es', 'daily', { salt: 0 });
    const second = pickNotificationCopySync('es', 'daily', { salt: 0 }, first.id);
    expect(second.id).not.toBe(first.id);
  });

  it('has English bank entries', () => {
    const copy = pickNotificationCopySync('en', 'capture', { salt: 3 });
    expect(copy.title.length).toBeGreaterThan(3);
    expect(copy.body.toLowerCase()).toMatch(/ellie|task|today|mind|line/);
  });
});
