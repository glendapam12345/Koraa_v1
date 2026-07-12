import { syncProfileDisplayNameFromAuth } from '@/lib/syncProfileDisplayName';

jest.mock('@/lib/profilePreferences', () => ({
  fetchProfilePreferences: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { supabase } from '@/lib/supabase';

describe('syncProfileDisplayNameFromAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns existing profile name without writing', async () => {
    (fetchProfilePreferences as jest.Mock).mockResolvedValue({
      data: { full_name: 'Pamela' },
    });

    await expect(
      syncProfileDisplayNameFromAuth('u1', { full_name: 'Other' }),
    ).resolves.toBe('Pamela');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('copies auth metadata into profile when profile name is empty', async () => {
    (fetchProfilePreferences as jest.Mock).mockResolvedValue({
      data: { full_name: null },
    });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(
      syncProfileDisplayNameFromAuth('u1', { full_name: '  Glenda  ' }),
    ).resolves.toBe('Glenda');
    expect(update).toHaveBeenCalledWith({ full_name: 'Glenda' });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
  });
});
