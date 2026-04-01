const axios = require('axios');

function isPostHogEnabled() {
  return Boolean(process.env.POSTHOG_HOST && process.env.POSTHOG_PROJECT_API_KEY);
}

async function capturePostHogEvent({ distinctId, event, properties = {} }) {
  if (!isPostHogEnabled() || !distinctId || !event) {
    return;
  }

  const posthogHost = process.env.POSTHOG_HOST.replace(/\/$/, '');

  try {
    await axios.post(
      `${posthogHost}/capture/`,
      {
        api_key: process.env.POSTHOG_PROJECT_API_KEY,
        distinct_id: distinctId,
        event,
        properties,
      },
      {
        timeout: 5000,
      }
    );
  } catch (error) {
    console.warn('PostHog capture failed:', error.message);
  }
}

module.exports = {
  capturePostHogEvent,
  isPostHogEnabled,
};
