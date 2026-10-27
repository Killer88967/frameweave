import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const loaderPath = require.resolve("./loader.cjs");

const DEVELOPMENT_PHASE = "phase-development-server";
const SOURCE_GLOB = "*.{jsx,tsx}";

/**
 * Adds Frameweave's source-location loader while `next dev` is running.
 * Production builds are returned untouched.
 *
 * @param {object | ((phase: string, context: any) => object | Promise<object>)} config
 */
export function withFrameweave(config = {}) {
  return async (phase, context) => {
    const resolved =
      typeof config === "function" ? await config(phase, context) : config;

    if (phase !== DEVELOPMENT_PHASE) return resolved;

    return addLoader(resolved);
  };
}

function addLoader(config) {
  const rule = {
    loaders: [loaderPath],
    condition: { not: "foreign" },
  };

  const existingRule = config.turbopack?.rules?.[SOURCE_GLOB];
  const rules = existingRule
    ? [...(Array.isArray(existingRule) ? existingRule : [existingRule]), rule]
    : rule;

  const userWebpack = config.webpack;

  return {
    ...config,

    turbopack: {
      ...config.turbopack,
      rules: {
        ...config.turbopack?.rules,
        [SOURCE_GLOB]: rules,
      },
    },

    // Only used with `next dev --webpack`.
    webpack(webpackConfig, options) {
      const result = userWebpack
        ? userWebpack(webpackConfig, options)
        : webpackConfig;

      result.module.rules.push({
        test: /\.[jt]sx$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: loaderPath,
      });

      return result;
    },
  };
}
