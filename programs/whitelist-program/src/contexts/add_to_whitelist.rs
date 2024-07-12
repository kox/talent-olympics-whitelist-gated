use anchor_lang::prelude::*;

use crate::state::Whitelist;

#[derive(Accounts)]
#[instruction(address_to_whitelist: Pubkey)]
pub struct AddToWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        seeds=[
            b"whitelist",
            address_to_whitelist.key().as_ref()
        ],
        bump,
        space = Whitelist::INIT_SPACE
    )]
    pub whitelist: Account<'info, Whitelist>,

    pub system_program: Program<'info, System>,
}

impl<'info> AddToWhitelist<'info> {
    pub fn add_to_whitelist(&mut self, _address_to_whitelist: Pubkey) -> Result<()> {

        self.whitelist.resolved = false;

        Ok(())
    }
}