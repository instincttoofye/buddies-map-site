use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ServerStats {
    pub member_count: i32,
}