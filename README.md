# Talent Olympics - Whitelist Gated

The Whitelist Gated Program is a Solana-based decentralized application that enables a whitelist-gated token sale. 

Users must be added to a whitelist to participate in the token sale. 

The program ensures that the token price remains static and imposes a purchase limit per wallet address.

`MINIMUM: 1 SOL`
`MAXIMUM: 2 SOL`

## Features

- Creates a new spl token and mints to the admin account.
- Admin can whitelist users creating PDAs in a way that it's not limited the amount of users.
- Users who has been whitelisted can purchase some tokens. They will send an amount of SOL to the admin.
- Admin will check how much sol they have sent and they will send them back new tokens.


## Accounts
* Whitelist
* Purchase


## Prerequisites

- Rust
- Solana CLI
- Anchor CLI
- Node.js
- Pnpm or Yarn or npm


## Installation

Clone the repository:

```bash
git clone https://github.com/kox-talent-olympics-whitelist-gated
cd talent-olympics-dao-voting
```

Install dependencies:

```bash
pnpm i
```

Build the program:

```bash
anchor build
```

Run the tests:

```bash
anchor test
```

Deploy the program:

```bash
anchor deploy
```


### Usage

Check the tests where provides all information to use each instruction and the expected data.


### Youtube video

`https://youtu.be/gEmAqbYqPSU`