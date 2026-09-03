import pinSvg from "../assets/base-icon-nms.svg";

const MapPin = ({
  x,
  y,
  username,
  labelRef,
  labelOffset,
}) => {
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

      <span
        ref={labelRef}
        className="map-pin-label"
        style={{
          "--label-offset-x": `${labelOffset.x}px`,
          "--label-offset-y": `${labelOffset.y}px`,
        }}
      >
        {username}
      </span>
    </div>
  );
};

export default MapPin;