pub fn normalize_discord_username(
    username: &str,
) -> String {
    let normalized_punctuation: String = username
        .trim()
        .chars()
        .map(|character| {
            match character {
                '’' | '‘' | '`' | '´' => '\'',
                _ => character,
            }
        })
        .collect();

    normalized_punctuation
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}