use anchor_lang::prelude::*;

#[error_code]
pub enum WhitelistErrors {
    #[msg("You need to increase to the minimum amount")]
    PurchaseNotEnough,
    #[msg("You have exceeded the limit")]
    PurchaseExceededLimit,
    #[msg("Not enough funds to purchase")]
    PurchaseNoEnoughFunds,
    #[msg("Failed to transfer SOL the purchase")]
    PurchaseFailedTransfer,
    #[msg("The user already received his tokens")]
    TokensAlreadySent,
    #[msg("The user didnt pay enough")]
    TokensNotEnough,

}