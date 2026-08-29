use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct MapUser {
    pub user_id: Uuid,
    pub discord_username: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}