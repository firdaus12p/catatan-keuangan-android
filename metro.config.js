const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = [...assetExts.filter((ext) => ext !== "sql"), "sql"];
config.resolver.sourceExts = sourceExts.filter((ext) => ext !== "sql");

module.exports = config;
