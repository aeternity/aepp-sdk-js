# AEProject

**AEProject** is an aeternity framework which helps with setting up an project.
The framework is built in the JavaScript SDK and no additional installations are needed.

## Initialize AEProject

```
aeproject init
```

The **init** command creates aeternity project structure with a few folders in which the developer can create
the contracts, tests and deployment files and  scripts. Docker configuration files are also created, for easy use of the aeternity blockchain network.


## Run unit tests

```
aeproject test
```

The **test** command help developers run their unit tests for aeternity proejcts. The command executes the tests scripts that are located in the **test** folder
of your aeternity project.



## Start docker epoch

```
aeproject epoch
```

The **epoch** command help developers run their local network on docker. Local network contains 3 nodes. To spawn fully functional network takes up to 1 minute. 30 seconds takes to up docker containers and up to 30 seconds to fund default wallets.

Beneficiary wallet: 
secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca',
		publicKey: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'

List of all default wallets 
[
    {
      publicKey: "ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk", 
      secretKey: "ak_HHC295F8zFpcagPpApwyapA2DXV6ki3WFZW7fbHi6jyhLMrpJsM1cannt2ySA9CsivEzAQzkLZhDzd6mAtgzbgxyiSru4"
    },
    {
      publicKey: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP",
      secretKey: "ak_HhegEtZYJE23JTXEGshDQ6xZ4CsC7qW8diCZsk893dSkP2ib5RCXzB2uofRV2csmiAWyuT6WfXwWA2uRJfRqZZbhTfeH6"
    },
    {
      publicKey: "ak_FHZrEbRmanKUe9ECPXVNTLLpRP2SeQCLCT6Vnvs9JuVu78J7V",
      secretKey: "ak_3keAmRQhg5XPQUWNPZ6GCkd7VpiwoYE8oMThJX6Tony8ZfRGp6R12teMCQq2dSA92EAvo3bPc4VMxdmH8LvJja2esASi4"
    },
    {
      publicKey: "ak_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp",
      secretKey: "ak_CcMj5Z9AR22Mw8CfQRqVi4sDVnBKsLJ91G3B92MTFEMkohPoUpVamBPReCAKWn3LZHX7Lj4bYiMKzWNFkZiziR696cKoR"
    },
    {
      publicKey: "ak_2VvB4fFu7BQHaSuW5EkQ7GCaM5qiA5BsFUHjJ7dYpAaBoeFCZi",
      secretKey: "ak_BW78ZXYUGCqofmemBqyEWGRSz8YWyC9QMyP162cwSBdZQPomdrrXhm9tfcxaiugABZXmtq7FzR8ZgPC67DKzEke7C59EG"
    },
    {
      publicKey: "ak_286tvbfP6xe4GY9sEbuN2ftx1LpavQwFVcPor9H4GxBtq5fXws",
      secretKey: "ak_FiS9o4tw9R87cshczZzEsRK29F1o1NDcX7AYAVgEFmuzXJR55aNVMwTLFJvnmxc2VZ3rPpsptbKAVnBL1vXtKcSGkDvhA"
    },
    {
      publicKey: "ak_f9bmi44rdvUGKDsTLp3vMCMLMvvqsMQVWyc3XDAYECmCXEbzy",
      secretKey: "ak_L9mrJp6fvifoUtR2amRZwz8wMySQP8GM5NJFkDTYQ81fKEdDerpZKk1GUMwY4Segy6yuVZL99cGCxwhJiURFoZxch3QLQ"
    },
    {
      publicKey: "ak_23p6pT7bajYMJRbnJ5BsbFUuYGX2PBoZAiiYcsrRHZ1BUY2zSF",
      secretKey: "ak_WUx8h4o18KAFJjHNt8Amti2WXn7wRf4gw5vxYbs3v93uCmGpe21QzQBVwvBFQU1Vhy1p6MNbpcEcipPu4TthebvskG9Dv"
    },
    {
      publicKey: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
      secretKey: "ak_FUwKv5yhtZHmk2o3ZKQSHtYT7gbY7cAU11QB6RZFXDhag5n3uqez1XDPkCHpHGDmE3Nfgs7smAabRhHLsiKXvMTfcMjVT"
    },
    {
      publicKey: "ak_zPoY7cSHy2wBKFsdWJGXM7LnSjVt6cn1TWBDdRBUMC7Tur2NQ",
      secretKey: "ak_87QPyEAD44fZTddnHi9vP1hSPaxPpmDy7TDHUqJxbeWgSLG27oLFAQaR4VC1zVTQXzmcW9cjcjjzVwnpHxmBw9DLgcyAM"
    }
  ] 




