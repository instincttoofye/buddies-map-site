mod models;
mod routes;
mod services;
mod utils;

use axum::{Router, http::Method, routing::get};

use dotenvy::dotenv;
use routes::map::{create_map_entry, get_map};
use routes::stats::{get_server_stats, increment_member_count};
use routes::regions::{get_regions, get_region_members};
use sqlx::PgPool;
use std::env;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;
use tracing::{
    error,
    info,
};

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::fmt()
    .with_env_filter(
        EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("info")),
    )
    .init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/map", get(get_map).post(create_map_entry))
        .route("/stats", get(get_server_stats))
        .route("/stats/member", axum::routing::post(increment_member_count))
        .route("/regions", get(get_regions))
        .route("/regions/{region}", get(get_region_members))
        .layer(cors)
        .with_state(pool);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3010")
        .await
        .expect("Failed to bind to port 3010");

    info!("Server running on port 3010");

    axum::serve(listener, app).await.expect("Server failed");
}
