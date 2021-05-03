module.exports = {
  apps: [{
    name: "default-api",
    script: "./index.js",
    instances: 2,
    exec_mode: "cluster"
  }],

  deploy: {
    production: {
      NODE_ENV: "production",
    }
  }
};
