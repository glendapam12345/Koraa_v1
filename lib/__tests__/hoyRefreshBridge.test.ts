import { requestHoyRefresh, subscribeHoyRefresh } from '@/lib/hoyRefreshBridge';

describe('hoyRefreshBridge', () => {
  it('notifies subscribers when refresh is requested', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeHoyRefresh(listener);

    requestHoyRefresh();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestHoyRefresh();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
