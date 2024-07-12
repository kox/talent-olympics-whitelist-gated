use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, Token2022, TokenAccount, TransferChecked,
};

use crate::{
    constants::{MAXIMUM_PRICE, MINIMUM_PRICE},
    errors::WhitelistErrors,
    state::{Purchase, Whitelist},
};

#[derive(Accounts)]
#[instruction(address_to_send_tokens: Pubkey)]
pub struct SendTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        token::mint = mint,
    )]
    admin_ta: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        token::mint = mint,
        token::authority = user_ta,
        token::token_program = token_program
    )]
    pub user_ta: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds=[
            b"whitelist",
            address_to_send_tokens.key().as_ref()
        ],
        bump,
    )]
    pub whitelist: Account<'info, Whitelist>,

    #[account(
        seeds=[
            b"purchase",
            address_to_send_tokens.key().as_ref()
        ],
        bump,
    )]
    pub purchase: Account<'info, Purchase>,

    mint: InterfaceAccount<'info, Mint>,

    token_program: Program<'info, Token2022>,

    pub system_program: Program<'info, System>,
}

impl<'info> SendTokens<'info> {
    pub fn send_tokens(&mut self, _address_to_send_tokens: Pubkey) -> Result<()> {
        let whitelist = &mut self.whitelist;
        let purchase = &mut self.purchase;

        if whitelist.resolved {
            return Err(WhitelistErrors::TokensAlreadySent.into());
        }

        if purchase.amount < MINIMUM_PRICE || purchase.amount > MAXIMUM_PRICE {
            return Err(WhitelistErrors::TokensNotEnough.into());
        }

        whitelist.resolved = true;

        transfer_checked(
            CpiContext::new(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.admin_ta.to_account_info(),
                    mint: self.mint.to_account_info(),
                    to: self.user_ta.to_account_info(),
                    authority: self.admin.to_account_info(),
                },
            ),
            purchase.amount,
            9,
        )?;

        Ok(())
    }
}
