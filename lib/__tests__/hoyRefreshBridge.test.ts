import {
  peekHoyPinnedTaskIds,
  requestHoyRefresh,
  resetHoyPinnedTaskIds,
  subscribeHoyRefresh,
} from '@/lib/hoyRefreshBridge';

describe('hoyRefreshBridge', () => {
  beforeEach(() => {
    resetHoyPinnedTaskIds();
  });

  it('notifies subscribers when refresh is requested', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeHoyRefresh(listener);

    requestHoyRefresh();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestHoyRefresh();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps freshly captured task ids so Hoy can pin them', () => {
    requestHoyRefresh({ pinTaskIds: ['a', 'b'] });
    expect(peekHoyPinnedTaskIds()).toEqual(['a', 'b']);
    requestHoyRefresh({ pinTaskIds: ['c'] });
    expect(peekHoyPinnedTaskIds()).toEqual(['c', 'a', 'b']);
  });
});
