import { useEffect, useState } from "react";

import {
    getRegions,
    getRegionMembers,
} from "../api/mapApi";

const RegionDropdown = () => {
    const [regions, setRegions] = useState([]);
    const [openRegion, setOpenRegion] = useState(null);
    const [regionMembers, setRegionMembers] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadRegions = async () => {
            try {
                const data = await getRegions();

                setRegions(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        };

        loadRegions();
    }, []);

    const handleRegionClick = async (region) => {
        if (openRegion === region) {
            setOpenRegion(null);
            return;
        }

        setOpenRegion(region);

        if (regionMembers[region]) {
            return;
        }

        try {
            const members = await getRegionMembers(region);

            setRegionMembers((current) => ({
                ...current,
                [region]: members,
            }));
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="region-dropdown">

            <h2 className="region-dropdown-title">
                VIEW BUDDIES BY REGION
            </h2>
            {error && (
                <p className="region-dropdown-error">
                    {error}
                </p>
            )}

            {regions.map((region) => {
                const isOpen =
                    openRegion === region.region;

                const members =
                    regionMembers[region.region] ?? [];

                return (
                    <div
                        className="region-section"
                        key={region.region}
                    >
                        <button
                            type="button"
                            className="region-header"
                            onClick={() =>
                                handleRegionClick(region.region)
                            }
                        >
                            <span className="region-name">
                                {region.region}
                            </span>

                            <span className="region-count">
                                {region.count}
                            </span>

                            <span
                                className={`region-arrow ${isOpen ? "open" : ""
                                    }`}
                            >
                                ▼
                            </span>
                        </button>

                        {isOpen && (
                            <div className="region-members">
                                {members.map((member) => (
                                    <div
                                        className="region-member"
                                        key={member.user_id}
                                    >
                                        <span className="region-member-name">
                                            {member.discord_username}
                                        </span>

                                        {member.platform && (
                                            <span className="region-member-platform">
                                                {member.platform}
                                            </span>
                                        )}

                                        <span className="region-member-location">
                                            {[
                                                member.city,
                                                member.state,
                                                member.country,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RegionDropdown;