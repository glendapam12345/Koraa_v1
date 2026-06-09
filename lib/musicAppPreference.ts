import AsyncStorage from '@react-native-async-storage/async-storage';

export type MusicAppChoice = 'spotify' | 'apple_music';

const STORAGE_KEY = 'koraa_music_app_choice';

export async function getMusicAppChoice(): Promise<MusicAppChoice | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value === 'spotify' || value === 'apple_music') {
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function setMusicAppChoice(choice: MusicAppChoice): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore */
  }
}
