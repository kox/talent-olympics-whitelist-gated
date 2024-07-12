use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod errors;
pub mod state;
use contexts::*;

declare_id!("GbP6iQ4NFfdRT6MSEnbT5rWGsrCYoETibVCMfFewnwVm");

#[program]
pub mod whitelist_program {
    use super::*;

    pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, address_to_whitelist: Pubkey) -> Result<()> {
        ctx.accounts.add_to_whitelist(address_to_whitelist)
    }

    pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>, address_to_remove: Pubkey) -> Result<()> {
        ctx.accounts.remove_from_whitelist(address_to_remove)
    }

    pub fn create_purchase(ctx: Context<CreatePurchase>, amount: u64) -> Result<()> {
        ctx.accounts.create_purchase(amount)
    }

    pub fn send_tokens(ctx: Context<SendTokens>, address_to_send_tokens: Pubkey) -> Result<()> {
        ctx.accounts.send_tokens(address_to_send_tokens)
    }
}
