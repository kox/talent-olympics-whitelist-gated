use anchor_lang::prelude::*;

#[account]
pub struct Whitelist {
    pub resolved: bool,
}

impl Space for Whitelist {
    const INIT_SPACE: usize = 8 + 1;
}