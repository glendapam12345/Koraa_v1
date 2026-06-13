import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'focused_project_';

export async function getFocusedProjectId(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function setFocusedProjectId(
  userId: string,
  projectId: string | null,
): Promise<void> {
  try {
    const key = `${KEY_PREFIX}${userId}`;
    if (projectId) {
      await AsyncStorage.setItem(key, projectId);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    /* non-critical */
  }
}
