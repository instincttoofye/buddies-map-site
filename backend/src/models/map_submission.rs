use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct MapSubmission {
    pub discord_username: String,
    pub country: String,
    pub state: Option<String>,
    pub city: String,
}