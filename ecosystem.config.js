module.exports = {
  apps: [{
    name: "default-api",
    script: "./index.js",
    instances: 2,
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production",
    }
  }],
};
