import {
  publishCheckInClosed,
  publishCheckInRefresh,
  subscribeCheckInClosed,
  subscribeCheckInRefresh,
} from '@/lib/checkInRefresh';

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

  it('notifies when check-in closes without saving', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCheckInClosed(listener);

    publishCheckInClosed();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    publishCheckInClosed();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
