module.exports = (value) => {
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
      const regex = new RegExp(`\\\$${r}`, 'i');
      value = value.replace(regex, process.env[r]);
    }
  }

  return value;
};
