use serde::Serialize;
use sqlx::FromRow;

#[derive(Serialize, FromRow)]
pub struct RegionCount {
    pub region: String,
    pub count: i64,
}