use anchor_lang::prelude::*;

use crate::state::Whitelist;

#[derive(Accounts)]
#[instruction(address_to_remove: Pubkey)]
pub struct RemoveFromWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        close = admin,
        seeds=[
            b"whitelist",
            address_to_remove.key().as_ref()
        ],
        bump,
    )]
    pub whitelist: Account<'info, Whitelist>,
}

impl<'info> RemoveFromWhitelist<'info> {
    pub fn remove_from_whitelist(&mut self, _address_to_remove: Pubkey) -> Result<()> {

        Ok(())
    }
}