import { useState, useEffect } from "react";

import { createMapUser, getServerStats } from "../api/mapApi";

import SubmitButton from "./SubmitButton";

const MapCards = ({ onUserCreated }) => {
    const [memberCount, setMemberCount] = useState(null);

    const [formData, setFormData] = useState({
        username: "",
        country: "",
        state: "",
        city: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const createdUser = await createMapUser(formData);

            console.log("Created map user:", createdUser);

            setFormData({
                username: "",
                country: "",
                state: "",
                city: "",
            });

            if (onUserCreated) {
                onUserCreated(createdUser);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const loadServerStats = async () => {
          try {
            const stats = await getServerStats();
            setMemberCount(stats.member_count);
          } catch (error) {
            console.error(
              "Failed to fetch Discord member count:",
              error
            );
          }
        };
      
        loadServerStats();
      }, []);

    return (
        <div className="map-cards">

            <div className="counter-card-border">
                <div className="counter-card">

                    <span className="counter-label">
                        DISCORD MEMBERS
                    </span>

                    <span className="counter-value">
  {memberCount ?? "---"}
</span>

                </div>
            </div>

            <div className="form-card-stack">

                <div className="main-card-border">
                    <div className="main-card">

                        <h2 className="form-title">
                            WHERE ARE YOU?
                        </h2>

                        <form
                            id="location-form"
                            className="location-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-field">
                                <label htmlFor="username">
                                    DISCORD NAME
                                </label>

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="country">
                                    COUNTRY
                                </label>

                                <input
                                    id="country"
                                    name="country"
                                    type="text"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="state">
                                    STATE/COUNTY
                                </label>

                                <input
                                    id="state"
                                    name="state"
                                    type="text"
                                    value={formData.state}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="city">
                                    CITY
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="form-error">
                                    {error}
                                </p>
                            )}

                        </form>

                    </div>
                </div>

                <SubmitButton disabled={isSubmitting} />

            </div>

        </div>
    );
};

export default MapCards;