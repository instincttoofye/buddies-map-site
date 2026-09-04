import buddiesLogo from "../assets/buddies-logo.svg";

const MapHeader = () => {
  return (
    <header className="map-header">
      <img
        src={buddiesLogo}
        alt="No Man's Sky Buddies"
        className="map-header-logo"
      />

      <h1 className="map-header-title">
        WHERE ARE OUR BUDDIES
      </h1>
      <h1 className="map-header-sub-title">
        UNDER CONSTRUCTION
      </h1>
    </header>
  );
}

export default MapHeader;