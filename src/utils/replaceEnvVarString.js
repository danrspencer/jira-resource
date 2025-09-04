module.exports = (value) => {
  const url = require('url');
  value = String(value);

  const replacements = [
    'BUILD_ID',
    'BUILD_NAME',
    'BUILD_JOB_NAME',
    'BUILD_PIPELINE_NAME',
    'BUILD_PIPELINE_INSTANCE_VARS',
    'BUILD_TEAM_NAME',
    'ATC_EXTERNAL_URL'
  ];

  for (const r of replacements) {
    if (r in process.env) {
      const regex = new RegExp(`\\\$${r}`, 'ig');

      if (r == 'BUILD_PIPELINE_INSTANCE_VARS') {
        var instance_vars = JSON.parse(process.env[r])
        var keys = Object.keys(instance_vars)
        const params = new url.URLSearchParams()

        for (i = 0; i < keys.length; i++) {
          var key = keys[i]
          params.append(`vars.${key}`, `"${instance_vars[key]}"`)
        }

        value = value.replace(regex, params.toString());
      }
      else {
        value = value.replace(regex, process.env[r]);
      }
    }
  }

  return value;
};
