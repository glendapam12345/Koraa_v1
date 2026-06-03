const mockRequireOptional = jest.fn<unknown | null, [string]>(() => null);

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: (name: string) => mockRequireOptional(name),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import {
  isDeviceCalendarNativeLinked,
  isDeviceCalendarSupported,
} from '@/lib/deviceCalendar';

describe('deviceCalendar availability', () => {
  beforeEach(() => {
    mockRequireOptional.mockReset();
    mockRequireOptional.mockReturnValue(null);
  });

  it('returns false when native module is not linked', () => {
    expect(isDeviceCalendarNativeLinked()).toBe(false);
    expect(isDeviceCalendarSupported()).toBe(false);
    expect(mockRequireOptional).toHaveBeenCalledWith('ExpoCalendar');
  });

  it('returns true on iOS when ExpoCalendar is linked', () => {
    mockRequireOptional.mockReturnValue({});
    expect(isDeviceCalendarNativeLinked()).toBe(true);
    expect(isDeviceCalendarSupported()).toBe(true);
  });
});
