// Mock console methods
const originalConsole = global.console;
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('logger', () => {
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    global.console = mockConsole as unknown as typeof console;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
    (global as any).__DEV__ = originalDev;
  });

  describe('debug', () => {
    it('should log in development mode', () => {
      (global as any).__DEV__ = true;
      // Reimportar el logger después de cambiar __DEV__
      jest.resetModules();
      const { logger } = require('@/lib/logger');
      
      logger.debug('Test debug message', { data: 'test' });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        { data: 'test' }
      );
    });

    it('should not log in production mode', () => {
      (global as any).__DEV__ = false;
      // Reimportar el logger después de cambiar __DEV__
      jest.resetModules();
      const { logger } = require('@/lib/logger');
      
      logger.debug('Test debug message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log in development mode', () => {
      (global as any).__DEV__ = true;
      jest.resetModules();
      const { logger } = require('@/lib/logger');
      
      logger.info('Test info message', { data: 'test' });
      
      // En desarrollo, debería loguear
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should always log warnings', () => {
      const { logger } = require('@/lib/logger');
      logger.warn('Test warning message', { data: 'test' });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[WARN] Test warning message',
        { data: 'test' }
      );
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      const { logger } = require('@/lib/logger');
      const error = new Error('Test error');
      logger.error('Test error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error
      );
    });

    it('should handle errors without data', () => {
      const { logger } = require('@/lib/logger');
      logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        ''
      );
    });
  });
});
