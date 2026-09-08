import buddiesLogo from "../assets/buddies-logo.svg";

const MapHeader = () => {
  return (
    <header className="map-header">
      <div className="map-header-content">
        <img
          src={buddiesLogo}
          alt="No Man's Sky Buddies"
          className="map-header-logo"
        />

        <div className="map-header-text">
          <h1 className="map-header-title">
            WHERE ARE OUR BUDDIES
          </h1>

        </div>
      </div>
    </header>
  );
};

export default MapHeader;