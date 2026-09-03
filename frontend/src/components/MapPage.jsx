import { useEffect, useRef, useState } from "react";

import { getMapUsers } from "../api/mapApi";
import { latLonToMapPosition } from "../utils/mapProjection";

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
    const timeout = setTimeout(() => {
      resolveLabelCollisions();
    }, 0);

    const handleResize = () => {
      resolveLabelCollisions();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      clearTimeout(timeout);

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [users]);

  const resolveLabelCollisions = () => {
    const entries = users
      .filter(
        (user) =>
          user.latitude != null &&
          user.longitude != null
      )
      .map((user) => {
        const element =
          labelRefs.current[user.user_id];

        if (!element) {
          return null;
        }

        const rect =
          element.getBoundingClientRect();

        return {
          id: user.user_id,
          width: rect.width,
          height: rect.height,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          offsetX: 0,
          offsetY: 0,
        };
      })
      .filter(Boolean);

    const padding = 6;
    const iterations = 30;

    for (
      let iteration = 0;
      iteration < iterations;
      iteration++
    ) {
      let moved = false;

      for (let i = 0; i < entries.length; i++) {
        for (
          let j = i + 1;
          j < entries.length;
          j++
        ) {
          const a = entries[i];
          const b = entries[j];

          const ax = a.x + a.offsetX;
          const ay = a.y + a.offsetY;

          const bx = b.x + b.offsetX;
          const by = b.y + b.offsetY;

          const dx = ax - bx;
          const dy = ay - by;

          const overlapX =
            (a.width + b.width) / 2 +
            padding -
            Math.abs(dx);

          const overlapY =
            (a.height + b.height) / 2 +
            padding -
            Math.abs(dy);

          if (
            overlapX > 0 &&
            overlapY > 0
          ) {
            moved = true;

            if (overlapX < overlapY) {
              const direction =
                dx >= 0 ? 1 : -1;

              const push =
                overlapX / 2;

              a.offsetX +=
                push * direction;

              b.offsetX -=
                push * direction;
            } else {
              const direction =
                dy >= 0 ? 1 : -1;

              const push =
                overlapY / 2;

              a.offsetY +=
                push * direction;

              b.offsetY -=
                push * direction;
            }
          }
        }
      }

      if (!moved) {
        break;
      }
    }

    const nextOffsets = {};

    for (const entry of entries) {
      nextOffsets[entry.id] = {
        x: entry.offsetX,
        y: entry.offsetY,
      };
    }

    setLabelOffsets(nextOffsets);
  };

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