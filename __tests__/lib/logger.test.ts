import { logger } from '@/lib/logger';

// Mock console methods
const originalConsole = global.console;
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('logger', () => {
  beforeEach(() => {
    global.console = mockConsole as unknown as typeof console;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('debug', () => {
    it('should log in development mode', () => {
      const originalDev = __DEV__;
      (global as { __DEV__: boolean }).__DEV__ = true;
      
      logger.debug('Test debug message', { data: 'test' });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        { data: 'test' }
      );
      
      (global as { __DEV__: boolean }).__DEV__ = originalDev;
    });

    it('should not log in production mode', () => {
      const originalDev = __DEV__;
      (global as { __DEV__: boolean }).__DEV__ = false;
      
      logger.debug('Test debug message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
      
      (global as { __DEV__: boolean }).__DEV__ = originalDev;
    });
  });

  describe('info', () => {
    it('should log in development mode', () => {
      logger.info('Test info message', { data: 'test' });
      
      // En desarrollo, debería loguear
      if (__DEV__) {
        expect(mockConsole.log).toHaveBeenCalled();
      }
    });
  });

  describe('warn', () => {
    it('should always log warnings', () => {
      logger.warn('Test warning message', { data: 'test' });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[WARN] Test warning message',
        { data: 'test' }
      );
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error
      );
    });

    it('should handle errors without data', () => {
      logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        ''
      );
    });
  });
});
