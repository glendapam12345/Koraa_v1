declare module 'react-native-health' {
  export type HealthValue = {
    id?: string;
    startDate: string;
    endDate: string;
    value: string;
    sourceId?: string;
    sourceName?: string;
  };

  export type HealthKitPermissions = {
    permissions: {
      read: string[];
      write: string[];
    };
  };

  type AppleHealthKitType = {
    Constants: {
      Permissions: {
        SleepAnalysis: string;
        [key: string]: string;
      };
    };
    initHealthKit: (
      permissions: HealthKitPermissions,
      callback: (error: string) => void,
    ) => void;
    getSleepSamples: (
      options: { startDate: string; endDate: string; ascending?: boolean; limit?: number },
      callback: (error: string, results: HealthValue[]) => void,
    ) => void;
  };

  const AppleHealthKit: AppleHealthKitType;
  export default AppleHealthKit;
}
