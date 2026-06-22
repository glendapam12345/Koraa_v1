import {
  isMissingProjectLifeAreaKeyColumnError,
  isMissingTaskLifeAreaKeyColumnError,
} from '@/lib/projectLifeAreaSchema';

describe('projectLifeAreaSchema', () => {
  it('detects missing tasks.life_area_key column', () => {
    const error = {
      code: 'PGRST204',
      message:
        "Could not find the 'life_area_key' column of 'tasks' in the schema cache",
    };
    expect(isMissingTaskLifeAreaKeyColumnError(error)).toBe(true);
    expect(isMissingProjectLifeAreaKeyColumnError(error)).toBe(false);
  });

  it('detects missing projects.life_area_key column', () => {
    const error = {
      code: 'PGRST204',
      message:
        "Could not find the 'life_area_key' column of 'projects' in the schema cache",
    };
    expect(isMissingProjectLifeAreaKeyColumnError(error)).toBe(true);
    expect(isMissingTaskLifeAreaKeyColumnError(error)).toBe(false);
  });
});
