module.exports = {
  apps : [{
    name: 'API',
    script: '/usr/src/app/src/api/index.js',
    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '4G'
  }]
};
