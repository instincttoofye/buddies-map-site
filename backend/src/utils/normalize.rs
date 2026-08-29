pub fn normalize_discord_username(
    username: &str,
) -> String {
    username
        .trim()
        .chars()
        .filter_map(|character| {
            match character {
                '’' | '‘' | '`' | '´' => Some('\''),
                character if character.is_whitespace() => None,
                _ => Some(character),
            }
        })
        .collect::<String>()
        .to_lowercase()
}