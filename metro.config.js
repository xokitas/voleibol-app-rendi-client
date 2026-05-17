const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Desactivar por completo la resolución de "exports"
// Esto hace que Metro use el campo "main" de cada dependencia,
// que en Zustand v5 es CommonJS y NO contiene import.meta
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
