use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use sqlx::PgPool;

use crate::models::region_count::RegionCount;
use crate::models::region_member::RegionMember;

pub async fn get_regions(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<RegionCount>>, (StatusCode, String)> {
    let regions = sqlx::query_as::<_, RegionCount>(
        r#"
        SELECT
            region,
            COUNT(*)::BIGINT AS count
        FROM locations
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY region
        "#,
    )
    .fetch_all(&pool)
    .await
    .map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        )
    })?;

    Ok(Json(regions))
}

pub async fn get_region_members(
    State(pool): State<PgPool>,
    Path(region): Path<String>,
) -> Result<Json<Vec<RegionMember>>, (StatusCode, String)> {
    let members = sqlx::query_as::<_, RegionMember>(
        r#"
        SELECT
            users.id AS user_id,
            users.discord_username,
            users.platform,
            locations.country,
            locations.state,
            locations.city
        FROM users
        INNER JOIN locations
            ON users.id = locations.user_id
        WHERE locations.region = $1
        ORDER BY users.discord_username
        "#,
    )
    .bind(region)
    .fetch_all(&pool)
    .await
    .map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        )
    })?;

    Ok(Json(members))
}