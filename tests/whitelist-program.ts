import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, MINT_SIZE, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createInitializeMint2Instruction, createMintToInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint } from "@solana/spl-token";
import { before, describe, it } from "node:test";

import { WhitelistProgram } from "../target/types/whitelist_program";
import { assert } from "chai";


describe("whitelist-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace.WhitelistProgram as Program<WhitelistProgram>;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    /* console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    ); */
    return signature;
  };

  const admin = Keypair.generate();
  const user = Keypair.generate();
  const mint = Keypair.generate();
  const userWhitelistPda = PublicKey.findProgramAddressSync([
    Buffer.from("whitelist"),
    user.publicKey.toBuffer(),
  ], program.programId)[0];
  const userPurchasePda = PublicKey.findProgramAddressSync([
    Buffer.from("purchase"),
    user.publicKey.toBuffer(),
  ], program.programId)[0];
  const adminAta = getAssociatedTokenAddressSync(
    mint.publicKey, 
    admin.publicKey, 
    false, 
    TOKEN_2022_PROGRAM_ID
  );
  const userAta = getAssociatedTokenAddressSync(
    mint.publicKey, 
    user.publicKey, 
    false, 
    TOKEN_2022_PROGRAM_ID
  );

  const accounts = {
    admin: admin.publicKey,
    user: user.publicKey,
    mint: mint.publicKey,
    userWhitelistPda,
    userPurchasePda,
    adminTa: adminAta,
    userTa: userAta,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId
  }

  console.log(accounts);
  
  it("Airdrops and tokens to the admin", async () => {
    let lamports = await getMinimumBalanceForRentExemptMint(connection);

    let tx = new Transaction();
    
    tx.instructions = [
      ...[admin, user].map((k) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: k.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      ),
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports,
        space: MINT_SIZE,
        programId: TOKEN_2022_PROGRAM_ID
      }),
      createInitializeMint2Instruction(
        mint.publicKey,
        9,
        admin.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        provider.publicKey, 
        adminAta, admin.publicKey, 
        mint.publicKey, 
        TOKEN_2022_PROGRAM_ID
      ),
      createMintToInstruction(
        mint.publicKey, 
        adminAta, 
        admin.publicKey, 
        1e11, // With 9 decimals, we are minting 100 tokens
        undefined, 
        TOKEN_2022_PROGRAM_ID
      ),
    ];
    await provider.sendAndConfirm(tx, [admin, mint]).then(log);
  });
 
  it("Add a user to the whitelist", async () => {
    const tx = await program.methods
      .addToWhitelist(accounts.user)
      .accounts({...accounts})
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);
    
    try {
      await program.account.whitelist.fetch(userWhitelistPda);
    } catch(err) {
      throw new Error('It will fail if the PDA doesnt exist');
    }
  });

  it("Removes can remove the user the whitelist", async () => {
    const tx = await program.methods
      .removeFromWhitelist(accounts.user)
      .accounts({...accounts})
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);

      try {
        await program.account.whitelist.fetch(userWhitelistPda);
        throw new Error('It will fail if the PDA still exists');
      } catch(err) {
        assert.ok(true);
      }
  });

  it("Add a user to the whitelist", async () => {
    await program.methods
      .addToWhitelist(accounts.user)
      .accounts({...accounts})
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);

    const whitelistData = await program.account.whitelist.fetch(userWhitelistPda);
    assert.notOk(whitelistData.resolved);
  });

  it("Can not exceed the limit amount of tokens to purchase", async () => {
    try {
      await program.methods
        .createPurchase(new BN(2.1 * LAMPORTS_PER_SOL)) // MAXIMUM is 2
        .accounts({...accounts})
        .signers([user])
        .rpc()
        .then(confirm)
        .then(log);

      throw new Error('It should not allow to purchase with more than 2 SOL');
    } catch(err) {
      assert.equal(err.error.errorCode.code, 'PurchaseExceededLimit');
      assert.equal(err.error.errorMessage, "You have exceeded the limit");
    }
  });

  it("is not possible to purchase bellow the minimum", async () => {
    try {
      await program.methods
        .createPurchase(new BN(0.9 * LAMPORTS_PER_SOL)) // MINIMUM is 1
        .accounts({...accounts})
        .signers([user])
        .rpc()
        .then(confirm)
        .then(log);

      throw new Error('It should not allow to purchase bellow 1 SOL');
    } catch(err) {
      assert.equal(err.error.errorCode.code, 'PurchaseNotEnough');
      assert.equal(err.error.errorMessage, "You need to increase to the minimum amount");
    }
  });

  it("Initiates the purchase flow", async () => {
    const userBalance = await provider.connection.getBalance(user.publicKey);
    const adminBalance = await provider.connection.getBalance(admin.publicKey);

    await program.methods
      .createPurchase(new BN(1 * LAMPORTS_PER_SOL)) // 1 SOL
      .accounts({...accounts})
      .signers([user])
      .rpc()
      .then(confirm)
      .then(log);

    const purchaseAccount = await program.account.purchase.fetch(userPurchasePda);
    assert.equal(purchaseAccount.amount.toNumber(), LAMPORTS_PER_SOL);

    const userLatestBalance = await provider.connection.getBalance(user.publicKey);
    const adminLatestBalance = await provider.connection.getBalance(admin.publicKey);

    assert.ok(userBalance > userLatestBalance);
    assert.ok(adminBalance == adminLatestBalance - LAMPORTS_PER_SOL);
  });

  it("Sends the tokens to the user", async () => {
    const adminBalance =  await connection.getTokenAccountBalance(adminAta);

    await program.methods
      .sendTokens(user.publicKey)
      .accounts({
        admin: accounts.admin,
        mint: accounts.mint,
        adminTa: accounts.adminTa,
        userAta: accounts.userTa,
        userWhitelistPda: accounts.userWhitelistPda,
        userPurchasePda: accounts.userPurchasePda,
        associatedTokenProgram: accounts.associatedTokenProgram,
        tokenProgram: accounts.tokenProgram,
        systemProgram: accounts.systemProgram,
      })
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);
      
    const whitelistData = await program.account.whitelist.fetch(userWhitelistPda);
    assert.ok(whitelistData.resolved);

    const adminLatestBalance =  await connection.getTokenAccountBalance(adminAta);

    assert.equal(adminBalance.value.amount, '100000000000');
    assert.equal(adminLatestBalance.value.amount, '99000000000');
  });
});
