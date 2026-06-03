const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const legacyKoraav2 = new RegExp(
  `${path.resolve(__dirname, 'koraav2').replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`,
);

const existingBlockList = config.resolver?.blockList;
config.resolver = {
  ...config.resolver,
  blockList: Array.isArray(existingBlockList)
    ? [...existingBlockList, legacyKoraav2]
    : existingBlockList
      ? [existingBlockList, legacyKoraav2]
      : [legacyKoraav2],
};

module.exports = config;
