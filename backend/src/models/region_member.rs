use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct RegionMember {
    pub user_id: Uuid,
    pub discord_username: Option<String>,
    pub platform: Option<String>,
    pub country: String,
    pub state: Option<String>,
    pub city: Option<String>,
}