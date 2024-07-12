use anchor_lang::prelude::*;

#[account]
pub struct Purchase {
    pub amount: u64,
}

impl Space for Purchase {
    const INIT_SPACE: usize = 8 + 8;
}
