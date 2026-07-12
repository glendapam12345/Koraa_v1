import AsyncStorage from '@react-native-async-storage/async-storage';

const LANDING_PREFIX = 'koraa_first_flow_landing_v1_';

export function getFirstFlowLandingKey(userId: string): string {
  return `${LANDING_PREFIX}${userId}`;
}

/** True until first tabs entry has been settled (stay on Hoy). */
export async function shouldLandOnTasksFirst(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getFirstFlowLandingKey(userId))) !== '1';
  } catch {
    return false;
  }
}

export async function markFirstFlowLandingComplete(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getFirstFlowLandingKey(userId), '1');
  } catch {
    /* no bloquear UI */
  }
}
