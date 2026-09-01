const BASE_URL = "https://buddies-map-backend.fly.dev";

export const getMapUsers = async () => {
  const response = await fetch(`${BASE_URL}/map`);

  if (!response.ok) {
    throw new Error(`Failed to fetch map users: ${response.status}`);
  }

  return response.json();
};

export const getServerStats = async () => {
    const response = await fetch(`${BASE_URL}/stats`);

    if(!response.ok) {
        throw new Error (
            `Failed to fetch member count: ${response.status}`
        );
    }

    return response.json();
}

export const createMapUser = async (formData) => {
  const response = await fetch(`${BASE_URL}/map`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      discord_username: formData.username,
      country: formData.country,
      state: formData.state || null,
      city: formData.city,
    }),
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Failed to create map user: ${response.status}`
    );
  }

  return response.json();
};