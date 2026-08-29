import pinSvg from "../assets/pin-outline.svg";

const MapPin = ({ x, y, username }) => {
  return (
    <div
      className="map-pin"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <img
        src={pinSvg}
        alt=""
        className="map-pin-icon"
      />

      <span className="map-pin-label">
        {username}
      </span>
    </div>
  );
}

export default MapPin;