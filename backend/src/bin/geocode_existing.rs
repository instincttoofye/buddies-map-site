use dotenvy::dotenv;
use sqlx::{FromRow, PgPool};
use std::{
    env,
    time::Duration,
};
use tokio::time::sleep;

#[path = "../services/geocoder.rs"]
mod geocoder;

#[derive(Debug, FromRow)]
struct Location {
    id: uuid::Uuid,
    city: Option<String>,
    state: Option<String>,
    country: String,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let database_url =
        env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");

    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let locations = sqlx::query_as::<_, Location>(
        r#"
        SELECT
            id,
            city,
            state,
            country
        FROM locations
        WHERE latitude IS NULL
           OR longitude IS NULL
        "#,
    )
    .fetch_all(&pool)
    .await
    .expect("Failed to retrieve locations");

    println!("Found {} locations to geocode.", locations.len());

    for location in locations {
        let Some(city) = location.city.as_deref() else {
            println!("Skipping location {}: no city", location.id);
            continue;
        };

        println!(
            "Geocoding: {}, {:?}, {}",
            city,
            location.state,
            location.country
        );

        match geocoder::geocode(
            city,
            location.state.as_deref(),
            &location.country,
        )
        .await
        {
            Ok(Some(coordinates)) => {
                sqlx::query(
                    r#"
                    UPDATE locations
                    SET
                        latitude = $1,
                        longitude = $2,
                        updated_at = NOW()
                    WHERE id = $3
                    "#,
                )
                .bind(coordinates.latitude)
                .bind(coordinates.longitude)
                .bind(location.id)
                .execute(&pool)
                .await
                .expect("Failed to update location");

                println!(
                    "✓ {}, {}",
                    coordinates.latitude,
                    coordinates.longitude
                );
            }

            Ok(None) => {
                println!("✗ No result found for {}", city);
            }

            Err(error) => {
                println!("✗ Geocoding error: {}", error);
            }
        }

        // Nominatim public API maximum: 1 request/second.
        sleep(Duration::from_secs(1)).await;
    }

    println!("Done.");
}