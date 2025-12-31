import { Platform } from 'react-native';

const LOCAL_DEV_BASE_URL =
  Platform.OS === 'web'
    ? 'http://127.0.0.1:5001/apna-house/us-central1/apiV2'
    : 'http://10.0.2.2:5001/apna-house/us-central1/apiV2';

const RENDER_BASE_URL = 'https://apiv2-pnmqz54req-uc.a.run.app';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
