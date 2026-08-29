use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct NominatimResult {
    lat: String,
    lon: String,
}

#[derive(Debug)]
pub struct Coordinates {
    pub latitude: f64,
    pub longitude: f64,
}

pub async fn geocode(
    city: &str,
    state: Option<&str>,
    country: &str,
) -> Result<Option<Coordinates>, reqwest::Error> {
    let client = Client::new();

    let mut params = vec![
        ("city", city),
        ("country", country),
        ("format", "jsonv2"),
        ("limit", "1"),
    ];

    if let Some(state) = state {
        params.push(("state", state));
    }

    let results = client
        .get("https://nominatim.openstreetmap.org/search")
        .header(
            "User-Agent",
            "WhereAreOurBuddies/0.1",
        )
        .query(&params)
        .send()
        .await?
        .error_for_status()?
        .json::<Vec<NominatimResult>>()
        .await?;

    let Some(result) = results.first() else {
        return Ok(None);
    };

    let latitude = match result.lat.parse::<f64>() {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };

    let longitude = match result.lon.parse::<f64>() {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };

    Ok(Some(Coordinates {
        latitude,
        longitude,
    }))
}