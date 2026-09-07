use axum::{Json, extract::State, http::StatusCode};

use sqlx::PgPool;

use tracing::{error, info};

use crate::models::{map_submission::MapSubmission, map_user::MapUser};
use crate::utils::normalize::normalize_discord_username;

fn get_region(country: &str) -> Option<&'static str> {
    match country.trim().to_lowercase().as_str() {
        // North America
        "usa"
        | "us"
        | "u.s."
        | "u.s.a."
        | "united states"
        | "united states of america"
        | "canada"
        | "mexico"
        | "greenland"
        | "belize"
        | "costa rica"
        | "el salvador"
        | "guatemala"
        | "honduras"
        | "nicaragua"
        | "panama"
        | "bahamas"
        | "barbados"
        | "cuba"
        | "dominica"
        | "dominican republic"
        | "grenada"
        | "haiti"
        | "jamaica"
        | "saint kitts and nevis"
        | "saint lucia"
        | "saint vincent and the grenadines"
        | "trinidad and tobago"
        | "antigua and barbuda" => Some("North America"),

        // South America
        "argentina" | "bolivia" | "brazil" | "chile" | "colombia" | "ecuador" | "guyana"
        | "paraguay" | "peru" | "suriname" | "uruguay" | "venezuela" => Some("South America"),

        // Europe
        "albania"
        | "andorra"
        | "austria"
        | "belarus"
        | "belgium"
        | "bosnia and herzegovina"
        | "bulgaria"
        | "croatia"
        | "cyprus"
        | "czechia"
        | "czech republic"
        | "denmark"
        | "estonia"
        | "finland"
        | "france"
        | "germany"
        | "greece"
        | "hungary"
        | "iceland"
        | "ireland"
        | "italy"
        | "kosovo"
        | "latvia"
        | "liechtenstein"
        | "lithuania"
        | "luxembourg"
        | "malta"
        | "moldova"
        | "monaco"
        | "montenegro"
        | "netherlands"
        | "north macedonia"
        | "norway"
        | "poland"
        | "portugal"
        | "romania"
        | "san marino"
        | "serbia"
        | "slovakia"
        | "slovenia"
        | "spain"
        | "españa"
        | "sweden"
        | "switzerland"
        | "uk"
        | "united kingdom"
        | "england"
        | "scotland"
        | "wales"
        | "northern ireland"
        | "ukraine"
        | "vatican city" => Some("Europe"),

        // Africa
        "algeria"
        | "angola"
        | "benin"
        | "botswana"
        | "burkina faso"
        | "burundi"
        | "cabo verde"
        | "cape verde"
        | "cameroon"
        | "central african republic"
        | "chad"
        | "comoros"
        | "democratic republic of the congo"
        | "dr congo"
        | "congo"
        | "republic of the congo"
        | "djibouti"
        | "egypt"
        | "equatorial guinea"
        | "eritrea"
        | "eswatini"
        | "ethiopia"
        | "gabon"
        | "gambia"
        | "ghana"
        | "guinea"
        | "guinea-bissau"
        | "ivory coast"
        | "côte d'ivoire"
        | "kenya"
        | "lesotho"
        | "liberia"
        | "libya"
        | "madagascar"
        | "malawi"
        | "mali"
        | "mauritania"
        | "mauritius"
        | "morocco"
        | "mozambique"
        | "namibia"
        | "niger"
        | "nigeria"
        | "rwanda"
        | "sao tome and principe"
        | "senegal"
        | "seychelles"
        | "sierra leone"
        | "somalia"
        | "south africa"
        | "south sudan"
        | "sudan"
        | "tanzania"
        | "togo"
        | "tunisia"
        | "uganda"
        | "zambia"
        | "zimbabwe" => Some("Africa"),

        // Asia
        "afghanistan"
        | "armenia"
        | "azerbaijan"
        | "bahrain"
        | "bangladesh"
        | "bhutan"
        | "brunei"
        | "cambodia"
        | "china"
        | "georgia"
        | "india"
        | "indonesia"
        | "iran"
        | "iraq"
        | "israel"
        | "japan"
        | "jordan"
        | "kazakhstan"
        | "kuwait"
        | "kyrgyzstan"
        | "laos"
        | "lebanon"
        | "malaysia"
        | "maldives"
        | "mongolia"
        | "myanmar"
        | "burma"
        | "nepal"
        | "north korea"
        | "oman"
        | "pakistan"
        | "palestine"
        | "philippines"
        | "qatar"
        | "saudi arabia"
        | "singapore"
        | "south korea"
        | "sri lanka"
        | "syria"
        | "taiwan"
        | "tajikistan"
        | "thailand"
        | "timor-leste"
        | "turkey"
        | "türkiye"
        | "turkmenistan"
        | "united arab emirates"
        | "uae"
        | "uzbekistan"
        | "vietnam"
        | "yemen" => Some("Asia"),

        // Oceania
        "australia"
        | "fiji"
        | "kiribati"
        | "marshall islands"
        | "micronesia"
        | "federated states of micronesia"
        | "nauru"
        | "new zealand"
        | "palau"
        | "papua new guinea"
        | "samoa"
        | "solomon islands"
        | "tonga"
        | "tuvalu"
        | "vanuatu" => Some("Oceania"),

        _ => None,
    }
}
pub async fn get_map(State(pool): State<PgPool>) -> Result<Json<Vec<MapUser>>, StatusCode> {
    info!("GET /map - request received");

    let users = sqlx::query_as::<_, MapUser>(
        r#"
        SELECT
            users.id AS user_id,
            users.discord_username,
            locations.city,
            locations.state,
            locations.country,
            locations.latitude,
            locations.longitude
        FROM users
        INNER JOIN locations
            ON locations.user_id = users.id
        ORDER BY users.discord_username
        "#,
    )
    .fetch_all(&pool)
    .await
    .map_err(|error| {
        error!(
            error = %error,
            "GET /map - failed to retrieve map users"
        );

        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        user_count = users.len(),
        "GET /map - successfully retrieved map users"
    );

    Ok(Json(users))
}

pub async fn create_map_entry(
    State(pool): State<PgPool>,
    Json(payload): Json<MapSubmission>,
) -> Result<(StatusCode, Json<MapUser>), (StatusCode, String)> {
    info!("POST /map - request received");

    let discord_username = payload.discord_username.trim();
    let country = payload.country.trim();
    let city = payload.city.trim();
    let platform = payload.platform.trim();

    let platform = match platform.to_lowercase().as_str() {
        "xbox" => "Xbox",
        "playstation" => "PlayStation",
        "pc" => "PC",
        "switch" => "Switch",
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                "Unsupported platform".to_string(),
            ));
        }
    };

    if platform.is_empty() {
        info!(
            discord_username = %discord_username,
            "POST /map - rejected request: platform is missing"
        );
    
        return Err((
            StatusCode::BAD_REQUEST,
            "Platform is required".to_string(),
        ));
    }

    let region = get_region(country)
        .ok_or_else(|| (StatusCode::BAD_REQUEST, "Unsupported country".to_string()))?;

    let normalized_username = normalize_discord_username(discord_username);

    if discord_username.is_empty() {
        info!("POST /map - rejected request: Discord username is missing");

        return Err((
            StatusCode::BAD_REQUEST,
            "Discord username is required".to_string(),
        ));
    }

    if country.is_empty() {
        info!(
            discord_username = %discord_username,
            "POST /map - rejected request: country is missing"
        );

        return Err((StatusCode::BAD_REQUEST, "Country is required".to_string()));
    }

    if city.is_empty() {
        info!(
            discord_username = %discord_username,
            country = %country,
            "POST /map - rejected request: city is missing"
        );

        return Err((StatusCode::BAD_REQUEST, "City is required".to_string()));
    }

    let state = payload
        .state
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    let username_exists = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE discord_username_normalized = $1
        )
        "#,
    )
    .bind(&normalized_username)
    .fetch_one(&pool)
    .await
    .map_err(internal_error)?;

    if username_exists {
        info!(
            discord_username = %discord_username,
            nromalized_username = %normalized_username,
            "POST /map = rejected duplicate Discord username"
        );

        return Err((
            StatusCode::CONFLICT,
            "That Discord user is already on the map".to_string(),
        ));
    }

    info!(
        discord_username = %discord_username,
        city = %city,
        state = ?state,
        country = %country,
        "POST /map - attempting geocoding"
    );

    // Geocode BEFORE creating anything in Postgres.
    let coordinates = crate::services::geocoder::geocode(city, state, country)
        .await
        .map_err(|error| {
            error!(
                error = %error,
                discord_username = %discord_username,
                city = %city,
                state = ?state,
                country = %country,
                "POST /map - geocoding request failed"
            );

            (
                StatusCode::BAD_GATEWAY,
                "Failed to geocode location".to_string(),
            )
        })?
        .ok_or_else(|| {
            info!(
                discord_username = %discord_username,
                city = %city,
                state = ?state,
                country = %country,
                "POST /map - geocoder returned no matching location"
            );

            (
                StatusCode::BAD_REQUEST,
                "Could not find that location".to_string(),
            )
        })?;

    info!(
        discord_username = %discord_username,
        latitude = coordinates.latitude,
        longitude = coordinates.longitude,
        "POST /map - geocoding successful"
    );

    let mut transaction = pool.begin().await.map_err(internal_error)?;

    info!(
        discord_username = %discord_username,
        "POST /map - database transaction started"
    );

    let user_id: uuid::Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO users (
            discord_username,
            discord_username_normalized,
            platform
        )
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
    )
    .bind(discord_username)
    .bind(&normalized_username)
    .bind(platform)
    .fetch_one(&mut *transaction)
    .await
    .map_err(internal_error)?;

    info!(
        user_id = %user_id,
        discord_username = %discord_username,
        "POST /map - user created"
    );

    sqlx::query(
        r#"
        INSERT INTO locations (
    user_id,
    country,
    state,
    city,
    latitude,
    longitude,
    region
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
    )
    .bind(user_id)
    .bind(country)
    .bind(state)
    .bind(city)
    .bind(coordinates.latitude)
    .bind(coordinates.longitude)
    .bind(region)
    .execute(&mut *transaction)
    .await
    .map_err(internal_error)?;

    info!(
        user_id = %user_id,
        city = %city,
        state = ?state,
        country = %country,
        "POST /map - location created"
    );

    transaction.commit().await.map_err(internal_error)?;

    info!(
        user_id = %user_id,
        discord_username = %discord_username,
        "POST /map - database transaction committed"
    );

    let created_user = MapUser {
        user_id,
        discord_username: Some(discord_username.to_string()),
        city: Some(city.to_string()),
        state: state.map(String::from),
        country: country.to_string(),
        latitude: Some(coordinates.latitude),
        longitude: Some(coordinates.longitude),
    };

    info!(
        user_id = %user_id,
        discord_username = %discord_username,
        "POST /map - map entry successfully created"
    );

    Ok((StatusCode::CREATED, Json(created_user)))
}

fn internal_error(error: sqlx::Error) -> (StatusCode, String) {
    error!(
        error = %error,
        "Database operation failed"
    );

    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Internal server error".to_string(),
    )
}
