import { publishCheckInRefresh, subscribeCheckInRefresh } from '@/lib/checkInRefresh';

describe('checkInRefresh', () => {
  it('notifies subscribers when check-in is refreshed', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCheckInRefresh(listener);

    publishCheckInRefresh();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    publishCheckInRefresh();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
