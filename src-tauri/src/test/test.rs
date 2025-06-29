#[cfg(test)]
mod tests {

    use crate::rgb::pick::mouse_rgb;
    #[test]
    fn test() {
        let a = mouse_rgb();
        println!("Mouse RGB: {}", a);
    }

}