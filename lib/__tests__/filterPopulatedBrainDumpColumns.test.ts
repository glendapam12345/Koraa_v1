import {
  filterPopulatedBrainDumpColumns,
  filterVisibleBrainDumpAreaColumns,
  isUserAddedCustomAreaColumn,
  splitBrainDumpBoardColumns,
  type BrainDumpAreaColumn,
} from '@/lib/review/buildBrainDumpAreaBoardModel';

function column(
  id: string,
  taskCount: number,
  options: { isLoose?: boolean; userCustom?: boolean } = {},
): BrainDumpAreaColumn {
  const { isLoose = false, userCustom = false } = options;
  const ref = isLoose ? null : userCustom ? (`custom:a${id}` as BrainDumpAreaColumn['ref']) : (id as BrainDumpAreaColumn['ref']);

  return {
    id: userCustom ? `custom:a${id}` : id,
    ref,
    name: id,
    emoji: '🌿',
    color: '#ccc',
    isLoose,
    projectGroups: isLoose
      ? []
      : [
          {
            id: 'g1',
            name: 'Group',
            tasks: Array.from({ length: taskCount }, (_, index) => ({
              id: `t-${id}-${index}`,
              title: `Task ${index}`,
              areaId: id,
              iconEmoji: '',
              timeLabel: '',
              durationLabel: '',
              status: 'pending' as const,
              scheduledDate: '',
            })),
          },
        ],
    tasks: isLoose
      ? Array.from({ length: taskCount }, (_, index) => ({
          id: `loose-${index}`,
          title: `Loose ${index}`,
          areaId: id,
          iconEmoji: '',
          timeLabel: '',
          durationLabel: '',
          status: 'pending' as const,
          scheduledDate: '',
        }))
      : [],
  };
}

describe('splitBrainDumpBoardColumns', () => {
  it('separates loose column from area columns', () => {
    const columns = [column('work', 2), column('home', 1), column('loose', 3, { isLoose: true })];
    const { looseColumn, areaColumns } = splitBrainDumpBoardColumns(columns);
    expect(looseColumn?.id).toBe('loose');
    expect(areaColumns.map((entry) => entry.id)).toEqual(['work', 'home']);
  });
});

describe('filterPopulatedBrainDumpColumns', () => {
  it('keeps only columns with tasks', () => {
    const columns = [column('work', 2), column('home', 0), column('health', 1)];
    expect(filterPopulatedBrainDumpColumns(columns).map((entry) => entry.id)).toEqual([
      'work',
      'health',
    ]);
  });
});

describe('filterVisibleBrainDumpAreaColumns', () => {
  it('keeps empty user-added custom areas visible', () => {
    const columns = [
      column('work', 2),
      column('home', 0),
      column('mascotas', 0, { userCustom: true }),
    ];
    expect(filterVisibleBrainDumpAreaColumns(columns).map((entry) => entry.id)).toEqual([
      'work',
      'custom:amascotas',
    ]);
  });

  it('detects user custom areas but not preset custom ids', () => {
    expect(isUserAddedCustomAreaColumn(column('mascotas', 0, { userCustom: true }))).toBe(true);
    expect(
      isUserAddedCustomAreaColumn({
        ...column('familia', 0),
        id: 'custom:bd_familia',
        ref: 'custom:bd_familia',
      }),
    ).toBe(false);
  });
});
