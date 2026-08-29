import { useEffect, useState } from "react";

import { getMapUsers } from "../api/mapApi";
import { latLonToMapPosition } from "../utils/mapProjection";

import mapSvg from "../assets/buddies-map.svg";

import MapPin from "./MapPin";
import MapHeader from "./MapHeader";
import MapCards from "./MapCards";

const MapPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getMapUsers();

        console.log("Map users:", data);

        setUsers(data);
      } catch (err) {
        console.error(err);

        setError(err.message);
      }
    };

    loadUsers();
  }, []);

  return (
    <main className="map-page">

      {error && <p>{error}</p>}

      <MapHeader />

      <div className="map-container">

        <div className="map-visual">

          <img
            src={mapSvg}
            alt="World map"
            className="world-map"
          />

          {users.map((user) => {
            if (
              user.latitude == null ||
              user.longitude == null
            ) {
              return null;
            }

            const position = latLonToMapPosition(
              user.latitude,
              user.longitude
            );

            if (!position) {
              return null;
            }

            return (
              <MapPin
                key={user.user_id}
                x={position.x}
                y={position.y}
                username={user.discord_username}
              />
            );
          })}

        </div>

        <MapCards
          onUserCreated={(newUser) => {
            setUsers((currentUsers) => [
              ...currentUsers,
              newUser,
            ]);
          }}
        />

      </div>

    </main>
  );
};

export default MapPage;