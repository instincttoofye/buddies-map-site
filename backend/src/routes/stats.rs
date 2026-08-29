use axum::{Json, extract::State, http::StatusCode};

use sqlx::PgPool;

use tracing::{error, info};

use crate::models::server_stats::ServerStats;

pub async fn get_server_stats(
    State(pool): State<PgPool>,
) -> Result<Json<ServerStats>, (StatusCode, String)> {
    info!("GET /stats - request received");

    let stats = sqlx::query_as::<_, ServerStats>(
        r#"
        SELECT member_count
        FROM server_stats
        WHERE id = 1
        "#,
    )
    .fetch_one(&pool)
    .await
    .map_err(|error| {
        error!(
            error = %error,
            "GET /stats - failed to retrieve server stats"
        );

        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to retrieve server stats".to_string(),
        )
    })?;

    info!(
        member_count = stats.member_count,
        "GET /stats - successfully retrieved server stats"
    );

    Ok(Json(stats))
}

pub async fn increment_member_count(
    State(pool): State<PgPool>,
) -> Result<Json<ServerStats>, (StatusCode, String)> {
    info!("POST /stats/member - request received");

    let stats = sqlx::query_as::<_, ServerStats>(
        r#"
        UPDATE server_stats
        SET
            member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = 1
        RETURNING member_count
        "#,
    )
    .fetch_one(&pool)
    .await
    .map_err(|error| {
        error!(
            error = %error,
            "POST /stats/member - failed to increment member count"
        );

        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to increment member count".to_string(),
        )
    })?;

    info!(
        member_count = stats.member_count,
        "POST /stats/member - member count incremented successfully"
    );

    Ok(Json(stats))
}
