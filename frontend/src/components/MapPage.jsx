import { useEffect, useRef, useState } from "react";

import { getMapUsers } from "../api/mapApi";
import { latLonToMapPosition } from "../utils/mapProjection";
import { resolveLabelCollisions } from "../utils/resolveLabelCollisions";

import mapSvg from "../assets/buddies-map.svg";

import MapPin from "./MapPin";
import MapHeader from "./MapHeader";
import MapCards from "./MapCards";

const MapPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const labelRefs = useRef({});
  const [labelOffsets, setLabelOffsets] = useState({});

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
  useEffect(() => {
    const updateLabelPositions = () => {
      const offsets =
        resolveLabelCollisions(
          users,
          labelRefs
        );
  
      setLabelOffsets(offsets);
    };
  
    const timeout = setTimeout(() => {
      updateLabelPositions();
    }, 0);
  
    window.addEventListener(
      "resize",
      updateLabelPositions
    );
  
    return () => {
      clearTimeout(timeout);
  
      window.removeEventListener(
        "resize",
        updateLabelPositions
      );
    };
  }, [users]);


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

            const position =
              latLonToMapPosition(
                user.latitude,
                user.longitude
              );

            if (!position) {
              return null;
            }

            const labelOffset =
              labelOffsets[user.user_id] ?? {
                x: 0,
                y: 0,
              };

            return (
              <MapPin
                key={user.user_id}
                x={position.x}
                y={position.y}
                username={
                  user.discord_username
                }
                labelRef={(element) => {
                  if (element) {
                    labelRefs.current[
                      user.user_id
                    ] = element;
                  }
                }}
                labelOffset={labelOffset}
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