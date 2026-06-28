import {
  buildAreaPlannerColumns,
  countOrganizableLooseTasks,
} from '@/lib/projects/buildAreaPlannerColumns';

describe('buildAreaPlannerColumns', () => {
  const groups = [
    {
      area: {
        ref: 'work' as const,
        name: 'Trabajo',
        emoji: '💼',
        color: '#4A8AD4',
        catalogKey: 'work' as const,
        isCustom: false,
      },
      looseTasks: [
        {
          id: 't1',
          content: 'Enviar correo',
          life_area_key: 'work',
          scheduled_date: null,
          created_at: '2026-06-22T10:00:00Z',
          is_completed: false,
        },
      ],
    },
    {
      area: {
        ref: 'health' as const,
        name: 'Salud',
        emoji: '🌿',
        color: '#2E9E6E',
        catalogKey: 'health' as const,
        isCustom: false,
      },
      looseTasks: [],
    },
  ];

  it('maps loose tasks into planner columns', () => {
    const columns = buildAreaPlannerColumns(groups);
    expect(columns).toHaveLength(2);
    expect(columns[0]?.tasks).toHaveLength(1);
    expect(columns[0]?.tasks[0]?.title).toBe('Enviar correo');
    expect(columns[0]?.tasks[0]?.areaId).toBe('work');
    expect(columns[1]?.tasks).toHaveLength(0);
  });

  it('counts organizable loose tasks', () => {
    expect(countOrganizableLooseTasks(groups)).toBe(1);
  });
});
