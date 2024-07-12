use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    constants::{MAXIMUM_PRICE, MINIMUM_PRICE}, 
    errors::WhitelistErrors, 
    state::{ Purchase, Whitelist }
};

#[derive(Accounts)]
pub struct CreatePurchase<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    admin: UncheckedAccount<'info>,

    #[account(
        seeds=[
            b"whitelist",
            user.key().as_ref()
        ],
        bump,
    )]
    pub whitelist: Account<'info, Whitelist>,

    #[account(
        init_if_needed,
        payer = user,
        seeds=[
            b"purchase",
            user.key().as_ref()
        ],
        bump,
        space = Purchase::INIT_SPACE
    )]
    pub purchase: Account<'info, Purchase>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreatePurchase<'info> {
    pub fn create_purchase(&mut self, amount: u64) -> Result<()> {
        let balance = self.user.to_account_info().lamports();

        if amount < MINIMUM_PRICE {
            return Err(WhitelistErrors::PurchaseNotEnough.into());
        }

        if self.purchase.amount + amount > MAXIMUM_PRICE {
            return Err(WhitelistErrors::PurchaseExceededLimit.into());
        }

        if balance < amount {
            return Err(WhitelistErrors::PurchaseNoEnoughFunds.into());
        }

        self.purchase.set_inner(Purchase {
            amount
        });

        let cpi_context = CpiContext::new(
            self.system_program.to_account_info(), 

            system_program::Transfer {
                from: self.user.to_account_info(),
                to: self.admin.to_account_info(),
            }
        );

        let res = system_program::transfer(cpi_context, amount);

        if res.is_ok() {
            return Ok(());
        } else {
            return Err(WhitelistErrors::PurchaseFailedTransfer.into());
        }

    }
}