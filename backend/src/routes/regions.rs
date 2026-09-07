use axum::{
    extract::State,
    http::StatusCode,
    Json,
};

use sqlx::PgPool;

use crate::models::region_count::RegionCount;

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